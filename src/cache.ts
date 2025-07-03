import { connect, NatsConnection, KV } from 'nats';
import { config } from './config';
import { logger } from './logger';
import { Permission, ErrorCode } from './types';

export class Cache {
    private nc: NatsConnection | null = null;
    private kv: KV | null = null;

    async init(): Promise<void> {
        try {
            this.nc = await connect({ servers: config.nats.url });
            const js = this.nc.jetstream();
            this.kv = await js.views.kv(config.cache.bucket);
            logger.info('Cache initialized successfully');
        } catch (error) {
            logger.error('Failed to initialize cache', { error });
            throw error;
        }
    }

    async setPermissions(apiKey: string, permissions: Permission[]): Promise<void> {
        try {
            if (!this.kv) throw new Error('Cache not initialized');

            const data = JSON.stringify(permissions);
            await this.kv.put(apiKey, data);

            logger.info('Permissions cached', { apiKey, count: permissions.length });
        } catch (error) {
            logger.error('Failed to cache permissions', { apiKey, error });
            throw new Error(`${ErrorCode.CACHE_ERROR}: Failed to cache permissions`);
        }
    }

    async getPermissions(apiKey: string): Promise<Permission[] | null> {
        try {
            if (!this.kv) throw new Error('Cache not initialized');

            const entry = await this.kv.get(apiKey);
            if (!entry) return null;

            const data = JSON.parse(entry.string());
            logger.info('Permissions retrieved from cache', { apiKey });
            return data;
        } catch (error) {
            logger.warn('Failed to get permissions from cache', { apiKey, error });
            return null;
        }
    }

    async invalidatePermissions(apiKey: string): Promise<void> {
        try {
            if (!this.kv) throw new Error('Cache not initialized');

            await this.kv.delete(apiKey);
            logger.info('Permissions cache invalidated', { apiKey });
        } catch (error) {
            logger.error('Failed to invalidate cache', { apiKey, error });
            // Не бросаем ошибку, так как это не критично
        }
    }

    async close(): Promise<void> {
        if (this.nc) {
            await this.nc.close();
        }
    }
}