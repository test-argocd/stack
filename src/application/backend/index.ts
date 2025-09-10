import * as k8s from '@pulumi/kubernetes/core/v1';
import { loadConfig } from '../../util/config';
import { Microservice } from './constants';
import { MicroserviceResource } from './microservice-resource';

interface BackendConfig {
	namespace: string;
}

const config = loadConfig<BackendConfig>('backend/common');
if (!config) {
	throw new Error('provide config for backend/common');
}

const namespace = new k8s.Namespace('backend/namespace', {
	metadata: {
		name: config.namespace,
	},
});

Object.values(Microservice).map(
	(microservice) =>
		new MicroserviceResource(microservice, {
			microservice,
			namespace: namespace.metadata.name,
		}),
);
