// const nginx = new NginxResource('nginx', {
// 	replicaCount: 1,
// 	serviceType: 'LoadBalancer',
// 	namespace: 'nginx',
// });
//
// const database = new PostgresResource('postgres', {
// 	namespace: 'postgres',
// 	password: 'root',
// 	username: 'root',
// 	database: 'root',
// 	persistence: {
// 		enabled: true,
// 	},
// });
//
// buildStack({ namespace: 'backend' }, { dependsOn: [nginx] });

import('../../infra/nginx');
import('../../infra/postgres');
import('../../application/backend');

export default {};
