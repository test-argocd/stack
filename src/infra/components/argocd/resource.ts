import * as k8s from '@pulumi/kubernetes';
import * as helm from '@pulumi/kubernetes/helm/v3';
import * as pulumi from '@pulumi/pulumi';

export interface KafkaResourceParams {
	namespace?: string;
	replicaCount?: number;
}

export class ArgoCDResource extends pulumi.ComponentResource {
	public readonly namespace: k8s.core.v1.Namespace;
	public readonly chart: helm.Chart;

	constructor(
		name: string,
		params: KafkaResourceParams,
		opts?: pulumi.ComponentResourceOptions,
	) {
		super('custom:argocd:ArgoCDResource', name, params, opts);

		const namespaceName = params?.namespace ?? 'default';
		this.namespace = new k8s.core.v1.Namespace('argocd-namespace', {
			metadata: {
				name: namespaceName,
			},
		});

		this.chart = new helm.Chart(
			'argocd',
			{
				chart: 'argo-cd',
				version: '5.46.7',
				namespace: namespaceName,
				fetchOpts: {
					repo: 'https://argoproj.github.io/argo-helm',
				},
				values: {
					server: {
						service: {
							type: 'ClusterIP',
						},
						ingress: {
							enabled: true,
							ingressClassName: 'nginx',
							annotations: {
								'nginx.ingress.kubernetes.io/ssl-redirect': 'false',
								'nginx.ingress.kubernetes.io/backend-protocol': 'HTTP',
								'kubernetes.io/ingress.class': 'nginx', // Fallback annotation
							},
							hosts: ['argocd.local'],
							paths: ['/'],
							pathType: 'Prefix',
							tls: [],
						},
						extraArgs: ['--insecure'],
					},
					configs: {
						params: {
							'server.insecure': 'false',
						},
					},
					dex: {
						enabled: false,
					},
					applicationSet: {
						enabled: false,
					},
					notifications: {
						enabled: false,
					},
				},
			},
			opts,
		);

		const argoCdApp = new k8s.apiextensions.CustomResource(
			'argocd-application',
			{
				apiVersion: 'argoproj.io/v1alpha1',
				kind: 'Application',
				metadata: {
					name: 'prometheus-dev',
					namespace: namespaceName,
					labels: {
						'app.kubernetes.io/name': 'prometheus-dev',
						'app.kubernetes.io/managed-by': 'pulumi',
					},
					finalizers: ['resources-finalizer.argocd.argoproj.io'],
				},
				spec: {
					project: 'default',
					source: {
						repoURL: 'https://github.com/test-argocd/stack',
						targetRevision: 'main',
						path: './src/k8s/manifests',
					},
					destination: {
						server: 'https://kubernetes.default.svc',
						namespace: 'prometheus-dev',
					},
					syncPolicy: {
						automated: {
							prune: true,
							selfHeal: true,
							allowEmpty: false,
						},
						syncOptions: [
							'CreateNamespace=true',
							'PrunePropagationPolicy=foreground',
							'PruneLast=true',
						],
						retry: {
							limit: 5,
							backoff: {
								duration: '5s',
								factor: 2,
								maxDuration: '3m',
							},
						},
					},
				},
			},
			{ ...opts, dependsOn: [this.chart] },
		);
	}
}
