import * as pulumi from '@pulumi/pulumi';
import { Microservice } from '../../../../application/backend/constants';
import postgresStackConfig from '../infra/postgres';

export const namespace = `${pulumi.getStack().toLowerCase()}-backend`;
export const grpcPort = 5000;
export const httpPort = 8080;

export const grpc = Object.values(Microservice).reduce(
	(acc, microservice) => {
		acc[microservice] = {
			host: `${microservice}.${namespace}.svc.cluster.local`,
			port: grpcPort,
		};
		return acc;
	},
	{} as Record<Microservice, { host: string; port: number }>,
);

export const postgresql = {
	host: `postgres-postgresql.${postgresStackConfig.namespace}.svc.cluster.local`,
	username: postgresStackConfig.username,
	password: postgresStackConfig.password,
	port: 5432,
	ssl: false,
};
