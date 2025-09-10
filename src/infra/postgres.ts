import * as k8s from '@pulumi/kubernetes';
import * as helm from '@pulumi/kubernetes/helm/v3';
import * as pulumi from '@pulumi/pulumi';
import { loadConfig } from '../util/config';

export interface PostgresConfig {
	namespace?: string;

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
	metrics?: boolean;
}

const config = loadConfig<PostgresConfig>('infra/postgres');
if (!config) {
	throw new Error('provide config for postgres');
}

const namespace = new k8s.core.v1.Namespace('postgres/namespace', {
	metadata: {
		name: config.namespace ?? 'postgres',
	},
});

const chart = new helm.Chart('postgres', {
	chart: 'postgresql',
	version: '12.8.2',
	namespace: namespace.metadata.name,
	fetchOpts: {
		repo: 'https://charts.bitnami.com/bitnami',
	},

	values: {
		auth: {
			postgresPassword: config.password,
			username: config.username,
			database: config.database,
			password: config.password,
		},
		primary: {
			resources: config.resources,
		},
		metrics: config.metrics,
	},
});

const pgSecret = k8s.core.v1.Secret.get(
	'pg-secret',
	pulumi.interpolate`${namespace.metadata.name}/postgres-postgresql`,
	{ dependsOn: [chart] },
);

export default {
	get host(): pulumi.Output<string> {
		return pulumi.interpolate`postgres.${namespace.metadata.name}.svc.cluster.local`;
	},

	get port(): number {
		return 5432;
	},

	get username(): pulumi.Output<string> {
		return pgSecret.data.apply((d) => {
			console.log(d);
			// return Buffer.from(d.username, 'base64').toString('utf8');
			return '';
		});
	},

	get password(): pulumi.Output<string> {
		return pgSecret.data.apply(
			(d) =>
				// Buffer.from(d.password, 'base64').toString('utf8'),
				'',
		);
	},
};
