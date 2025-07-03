import { Config } from './types';

export const config: Config = {
    nats: {
        url: process.env.NATS_URL || 'nats://localhost:4222'
    },
    postgres: {
        host: process.env.POSTGRES_HOST || 'localhost',
        port: parseInt(process.env.POSTGRES_PORT || '5432'),
        database: process.env.POSTGRES_DB || 'permissions',
        username: process.env.POSTGRES_USER || 'postgres',
        password: process.env.POSTGRES_PASSWORD || 'postgres'
    },
    cache: {
        bucket: 'permissions_cache'
    }
};