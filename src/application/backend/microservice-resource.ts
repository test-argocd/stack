import { readFileSync } from 'node:fs';
import * as k8s from '@pulumi/kubernetes';
import * as pulumi from '@pulumi/pulumi';

export interface MicroserviceResourceParams {
	namespace?: string;
	name: string;
	configFilePath: string;
}

export class MicroserviceResource extends pulumi.ComponentResource {
	public readonly namespace: k8s.core.v1.Namespace;
	public readonly configMap: k8s.core.v1.ConfigMap;
	public readonly deployment: k8s.apps.v1.Deployment;
	public readonly service: k8s.core.v1.Service;
	public readonly ingress: k8s.networking.v1.Ingress;

	constructor(
		private readonly name: string,
		private readonly params: MicroserviceResourceParams,
		private readonly opts?: pulumi.ComponentResourceOptions,
	) {
		super('custom:backend.MicroserviceResource', name, params, opts);

		const namespaceName = params?.namespace ?? 'backend';
		this.namespace = new k8s.core.v1.Namespace(
			`${pulumi.getStack()}/backend-namespace`,
			{
				metadata: {
					name: namespaceName,
				},
			},
			opts,
		);

		this.configMap = this.createConfigMap();
		this.deployment = this.createDeployment();
		this.service = this.createService();
		this.ingress = this.createIngressRoute();
	}

	private createConfigMap(): k8s.core.v1.ConfigMap {
		const configContent = readFileSync(this.params.configFilePath, 'utf8');

		return new k8s.core.v1.ConfigMap(
			`${this.name}/${this.params.name}/config-map`,
			{
				metadata: {
					name: this.params.name,
					namespace: this.namespace.metadata.name,
				},
				data: {
					'default.js': configContent,
				},
			},
			this.opts,
		);
	}

	private createDeployment(): k8s.apps.v1.Deployment {
		return new k8s.apps.v1.Deployment(
			`${this.name}/${this.params.name}/deployment`,
			{
				metadata: {
					name: this.params.name,
					namespace: this.namespace.metadata.name,
				},
				spec: {
					replicas: 1,
					selector: { matchLabels: { app: this.params.name } },
					template: {
						metadata: { labels: { app: this.params.name } },
						spec: {
							containers: [
								{
									imagePullPolicy: 'Always',
									name: this.params.name,
									image: 'andreipadureanu/sso:test',
									ports: [{ containerPort: 8080 }],
									volumeMounts: [
										{
											name: 'config-volume',
											mountPath: '/app/config',
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
			},
			{ ...this.opts, dependsOn: [this.configMap] },
		);
	}

	private createService(): k8s.core.v1.Service {
		return new k8s.core.v1.Service(
			`${this.name}/${this.params.name}/service`,
			{
				metadata: {
					name: this.params.name,
					namespace: this.namespace.metadata.name,
				},
				spec: {
					selector: { app: this.params.name },
					ports: [{ port: 80, targetPort: 8080 }],
				},
			},
			{ ...this.opts, dependsOn: [this.deployment] },
		);
	}

	private createIngressRoute(): k8s.networking.v1.Ingress {
		return new k8s.networking.v1.Ingress(
			`${this.name}/${this.params.name}/ingress`,
			{
				metadata: {
					name: `${this.params.name}-ingress`,
					namespace: this.namespace.metadata.name,
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
										path: `/api/${this.params.name}`,
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
			},
			{ ...this.opts, dependsOn: [this.service] },
		);
	}
}
