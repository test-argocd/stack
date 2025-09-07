import * as k8s from '@pulumi/kubernetes';
import * as helm from '@pulumi/kubernetes/helm/v3';
import * as pulumi from '@pulumi/pulumi';
import {
	DEFAULT_PERSISTENCE,
	DEFAULT_RESOURCES_LIMITS,
	DEFAULT_RESOURCES_REQUESTS,
} from './constants';

export interface PostgresResourceParams {
	namespace?: string;
	enabledMetrics?: boolean;

	password: string;
	username: string;
	database: string;

	persistence?: {
		enabled: boolean;
		size?: string;
	};

	resources?: {
		requests?: {
			memory: string;
			cpu: string;
		};
		limits?: {
			memory: string;
			cpu: string;
		};
	};
}

export class PostgresResource extends pulumi.ComponentResource {
	public readonly namespace: k8s.core.v1.Namespace;
	public readonly chart: helm.Chart;

	constructor(
		name: string,
		params: PostgresResourceParams,
		opts?: pulumi.ComponentResourceOptions,
	) {
		super('custom:postgres:PostgresResource', name, params, opts);

		const namespaceName = params?.namespace ?? 'default';
		this.namespace = new k8s.core.v1.Namespace('postgres-namespace', {
			metadata: {
				name: namespaceName,
			},
		});

		this.chart = new helm.Chart(
			'postgresql',
			{
				chart: 'postgresql',
				version: '12.8.2',
				namespace: namespaceName,
				fetchOpts: {
					repo: 'https://charts.bitnami.com/bitnami',
				},
				values: {
					auth: {
						postgresPassword: params.password,
						username: params.username,
						password: params.password,
						database: params.database,
					},
					primary: {
						persistence: params.persistence ?? DEFAULT_PERSISTENCE,
						resources: {
							requests:
								params?.resources?.requests ?? DEFAULT_RESOURCES_REQUESTS,
							limits: params?.resources?.requests ?? DEFAULT_RESOURCES_LIMITS,
						},
					},
					metrics: {
						enabled: params.enabledMetrics,
					},
				},
			},
			opts,
		);
	}
}
