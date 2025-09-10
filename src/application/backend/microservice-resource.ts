import * as k8s from '@pulumi/kubernetes';
import type * as pulumi from '@pulumi/pulumi';
import { loadConfig } from '../../util/config';
import type { Microservice } from './constants';

export class MicroserviceResource {
	public readonly configMap: k8s.core.v1.ConfigMap;
	public readonly deployment: k8s.apps.v1.Deployment;
	public readonly service: k8s.core.v1.Service;
	public readonly ingress: k8s.networking.v1.Ingress;

	constructor(
		public readonly name: string,
		public readonly args: MicroserviceResourceArgs,
	) {
		this.configMap = this.createConfigMap();
		this.deployment = this.createDeployment();
		this.service = this.createService();
		this.ingress = this.createIngress();
	}

	private createConfigMap(): k8s.core.v1.ConfigMap {
		const config = loadConfig(`backend/${this.args.microservice}`);
		if (!config) {
			throw new Error(`provide config for microservice`);
		}

		return new k8s.core.v1.ConfigMap(`${this.name}/config-map`, {
			metadata: {
				name: this.args.microservice,
				namespace: this.args.namespace,
			},
			data: {
				'default.js': `export default ${JSON.stringify(config)}`,
			},
		});
	}

	private createDeployment(): k8s.apps.v1.Deployment {
		return new k8s.apps.v1.Deployment(`${this.name}/deployment`, {
			metadata: {
				name: this.args.microservice,
				namespace: this.args.namespace,
			},
			spec: {
				replicas: 1,
				selector: { matchLabels: { app: this.args.microservice } },
				template: {
					metadata: {
						annotations: {
							// This forces Kubernetes to see a "change" even with same tag
							'deployment.kubernetes.io/timestamp': new Date().toISOString(),
						},
						labels: { app: this.args.microservice },
					},
					spec: {
						containers: [
							{
								imagePullPolicy: 'Always',
								name: this.args.microservice,
								image: 'docker.io/andreipadureanu/sso:test',
								ports: [
									{ name: 'http', containerPort: 8080, protocol: 'TCP' },
									{ name: 'grpc', containerPort: 5000, protocol: 'TCP' },
								],
								volumeMounts: [
									{
										name: 'config-volume',
										mountPath: `/usr/src/config/${this.args.microservice}`,
										readOnly: true,
									},
								],
							},
						],
						volumes: [
							{
								name: 'config-volume',
								configMap: {
									name: this.configMap.metadata.name,
									items: [
										{
											key: 'default.js',
											path: 'default.js',
										},
									],
								},
							},
						],
					},
				},
			},
		});
	}

	private createService(): k8s.core.v1.Service {
		return new k8s.core.v1.Service(`${this.args.microservice}/service`, {
			metadata: {
				name: `${this.args.microservice}`,
				namespace: this.args.namespace,
			},
			spec: {
				selector: { app: this.args.microservice },
				ports: [
					{
						name: 'grpc',
						port: 5000,
						targetPort: 5000,
						protocol: 'TCP',
					},
					{
						name: 'http',
						port: 80,
						targetPort: 8080,
						protocol: 'TCP',
					},
				],
			},
		});
	}

	private createIngress(): k8s.networking.v1.Ingress {
		const config = loadConfig<{ apiPrefix: string }>(
			`backend/${this.args.microservice}`,
		);
		if (!config) {
			throw new Error(`provide config for ${this.args.microservice}`);
		}

		return new k8s.networking.v1.Ingress(`${this.name}/ingress`, {
			metadata: {
				name: `${this.args.microservice}`,
				namespace: this.args.namespace,
				annotations: {
					'kubernetes.io/ingress.class': 'nginx',
					'nginx.ingress.kubernetes.io/ssl-redirect': 'false',
				},
			},
			spec: {
				rules: [
					{
						host: 'prometheus.local',
						http: {
							paths: [
								{
									path: config.apiPrefix,
									pathType: 'Prefix',
									backend: {
										service: {
											name: this.service.metadata.name,
											port: {
												number: 80,
											},
										},
									},
								},
							],
						},
					},
				],
			},
		});
	}
}

export interface MicroserviceResourceArgs {
	microservice: Microservice;
	namespace: pulumi.Output<string>;
}
