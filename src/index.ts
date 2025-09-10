import * as pulumi from '@pulumi/pulumi';

const stack = pulumi.getStack();

if (stack === 'dev') {
	import('./stack/dev');
}
if (stack.startsWith('pr')) {
	import('./stack/pr');
}
