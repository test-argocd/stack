import * as k8s from '@pulumi/kubernetes';
import * as helm from '@pulumi/kubernetes/helm/v3';
import * as pulumi from '@pulumi/pulumi';

export interface NginxResourceParams {
	replicaCount: number;
	serviceType: 'NodePort' | 'LoadBalancer';
	enableMetrics?: boolean;

	namespace?: string;
}

export class NginxResource extends pulumi.ComponentResource {
	public readonly namespace: k8s.core.v1.Namespace;
	public readonly chart: helm.Chart;

	constructor(
		name: string,
		params: NginxResourceParams,
		opts?: pulumi.ComponentResourceOptions,
	) {
		super('custom:nginx:NginxResource', name, params, opts);

		const namespaceName = params?.namespace ?? 'default';
		this.namespace = new k8s.core.v1.Namespace('nginx-namespace', {
			metadata: {
				name: namespaceName,
			},
		});

		this.chart = new helm.Chart(
			'nginx',
			{
				chart: 'ingress-nginx',
				version: '4.7.1',
				namespace: namespaceName,
				fetchOpts: {
					repo: 'https://kubernetes.github.io/ingress-nginx',
				},
				values: {
					controller: {
						replicaCount: 1,
						service: {
							type: params.serviceType,
						},
						metrics: {
							enabled: params.enableMetrics,
						},
					},
				},
			},
			{ dependsOn: [this.namespace] },
		);
	}
}
