import { grpc, postgresql } from './common';

export default {
	apiPrefix: '/api/sso',
	release: { version: 'test' },
	postgresqlConfig: { ...postgresql, database: 'postgres' },
	grpc,
};
