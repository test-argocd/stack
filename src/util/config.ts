import * as path from 'node:path';
import * as pulumi from '@pulumi/pulumi';

export function loadConfig<T>(resource: string): T | undefined {
	let stack = pulumi.getStack();
	if (stack.startsWith('pr')) {
		stack = 'pr';
	}

	const configs = require(
		path.join(__dirname, '../stack', stack, 'config', resource),
	);

	return configs.default ?? configs;
}
