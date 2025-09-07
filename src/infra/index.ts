import * as k8s from '@pulumi/kubernetes';
import * as pulumi from '@pulumi/pulumi';
import { ArgoCDResource } from './components/argocd';
import { NginxResource } from './components/ingress';
import { KafkaResource } from './components/kafka';
import { PostgresResource } from './components/postgres';

// Load kubeconfig (assume you already created kind cluster manually)
const config = new pulumi.Config();
const kubeconfig = config.require('kubeconfig');

const provider = new k8s.Provider('kind', { kubeconfig });

const nginx = new NginxResource('nginx-resource', {
	namespace: 'nginx',
	replicaCount: 1,
	serviceType: 'NodePort',
});

const postgres = new PostgresResource('postgres-resource', {
	namespace: 'postgres',
	password: 'root',
	username: 'root',
	database: 'root',
});

const kafka = new KafkaResource('kafka-resource', {
	namespace: 'kafka',
});

const argoCd = new ArgoCDResource(
	'argocd-resource',
	{
		namespace: 'argocd',
	},
	{ dependsOn: [nginx] },
);
