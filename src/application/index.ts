import * as path from 'node:path';
import * as k8s from '@pulumi/kubernetes';
import { MicroserviceResource } from './backend/microservice-resource';

const provider = new k8s.Provider('render', {
	renderYamlToDirectory: './rendered-manifests',
});

const resource1 = new MicroserviceResource(
	'sso',
	{
		name: 'sso',
		namespace: 'backend',
		configFilePath: path.join(__dirname, './config.js'),
	},
	{ provider },
);

const resource2 = new MicroserviceResource(
	'audit',
	{
		name: 'audit',
		namespace: 'backend',
		configFilePath: path.join(__dirname, './config.js'),
	},
	{ provider },
);

const group = new k8s.yaml.ConfigGroup('manifests', {
	objs: [],
});

// @ts-ignore
export const yaml = group.toYaml();

// export const yamlDir = new k8s.yaml.ConfigGroup(
// 	'manifests',
// 	{
// 		objs: [
// 			resource2.namespace,
// 			resource2.deployment,
// 			resource2.configMap,
// 			resource2.ingress,
// 			resource2.service,
// 		],
// 	},
// 	{
// 		provider: new k8s.Provider('render', {
// 			renderYamlToDirectory: './rendered-manifests',
// 		}),
// 	},
// );
