import * as pulumi from '@pulumi/pulumi';
import { grpc, postgresql } from './common';

export default {
	apiPrefix: `/api/${pulumi.getStack().toLowerCase()}/sso`,
	release: { version: pulumi.getStack().toLowerCase() },
	postgresqlConfig: { ...postgresql, database: 'postgres' },
	grpc,
};
