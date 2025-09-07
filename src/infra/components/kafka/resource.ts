import * as k8s from '@pulumi/kubernetes';
import * as helm from '@pulumi/kubernetes/helm/v3';
import * as pulumi from '@pulumi/pulumi';

export interface KafkaResourceParams {
	namespace?: string;
	replicaCount?: number;
}

export class KafkaResource extends pulumi.ComponentResource {
	public readonly namespace: k8s.core.v1.Namespace;
	public readonly chart: helm.Chart;

	constructor(
		name: string,
		params: KafkaResourceParams,
		opts?: pulumi.ComponentResourceOptions,
	) {
		super('custom:kafka:KafkaResource', name, params, opts);

		const namespaceName = params?.namespace ?? 'default';
		this.namespace = new k8s.core.v1.Namespace('kafka-namespace', {
			metadata: {
				name: namespaceName,
			},
		});

		this.chart = new helm.Chart(
			'kafka',
			{
				chart: 'kafka',
				version: '26.4.2',
				namespace: namespaceName,
				fetchOpts: {
					repo: 'https://charts.bitnami.com/bitnami',
				},
				values: {
					persistence: {
						enabled: true,
						size: '2Gi',
					},
					kraft: {
						enabled: true,
					},
					controller: {
						replicaCount: params.replicaCount ?? 1,
					},
					listeners: {
						client: {
							protocol: 'PLAINTEXT',
							port: 9092,
						},
					},
				},
			},
			opts,
		);
	}
}
