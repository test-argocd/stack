import * as k8s from '@pulumi/kubernetes/core/v1';
import * as helm from '@pulumi/kubernetes/helm/v3';
import { loadConfig } from '../util/config';

interface NginxConfig {
	namespace: string;
}

const config = loadConfig<NginxConfig>('infra/nginx');

const namespace = new k8s.Namespace('nginx/namespace', {
	metadata: {
		name: config?.namespace ?? 'nginx',
	},
});

new helm.Chart('nginx', {
	chart: 'ingress-nginx',
	version: '4.7.1',
	namespace: namespace.metadata.name,
	fetchOpts: {
		repo: 'https://kubernetes.github.io/ingress-nginx',
	},
	values: {
		controller: {
			replicaCount: 1,
			service: {
				type: 'LoadBalancer',
			},
			metrics: {
				enabled: false,
			},
		},
	},
});
