import { Pool } from 'pg';
import { config } from './config';
import { logger } from './logger';
import { Permission, ErrorCode } from './types';

export class Database {
    private pool: Pool;

    constructor() {
        this.pool = new Pool({
            host: config.postgres.host,
            port: config.postgres.port,
            database: config.postgres.database,
            user: config.postgres.username,
            password: config.postgres.password,
            max: 20,
            idleTimeoutMillis: 30000,
            connectionTimeoutMillis: 2000,
        });
    }

    async init(): Promise<void> {
        try {
            await this.pool.query(`
        CREATE TABLE IF NOT EXISTS permissions (
          id SERIAL PRIMARY KEY,
          api_key VARCHAR(255) NOT NULL,
          module VARCHAR(255) NOT NULL,
          action VARCHAR(255) NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          UNIQUE(api_key, module, action)
        )
      `);

            await this.pool.query(`
        CREATE INDEX IF NOT EXISTS idx_permissions_api_key ON permissions(api_key)
      `);

            logger.info('Database initialized successfully');
        } catch (error) {
            logger.error('Failed to initialize database', { error });
            throw error;
        }
    }

    async grantPermission(apiKey: string, module: string, action: string): Promise<void> {
        try {
            await this.pool.query(
                'INSERT INTO permissions (api_key, module, action) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING',
                [apiKey, module, action]
            );

            logger.info('Permission granted', { apiKey, module, action });
        } catch (error) {
            logger.error('Failed to grant permission', { apiKey, module, action, error });
            throw new Error(`${ErrorCode.DB_ERROR}: Failed to grant permission`);
        }
    }

    async revokePermission(apiKey: string, module: string, action: string): Promise<void> {
        try {
            const result = await this.pool.query(
                'DELETE FROM permissions WHERE api_key = $1 AND module = $2 AND action = $3',
                [apiKey, module, action]
            );

            if (result.rowCount === 0) {
                throw new Error(`${ErrorCode.PERMISSION_NOT_FOUND}: Permission not found`);
            }

            logger.info('Permission revoked', { apiKey, module, action });
        } catch (error) {
            logger.error('Failed to revoke permission', { apiKey, module, action, error });
            throw error;
        }
    }

    async getPermissions(apiKey: string): Promise<Permission[]> {
        try {
            const result = await this.pool.query(
                'SELECT module, action FROM permissions WHERE api_key = $1',
                [apiKey]
            );

            return result.rows.map(row => ({
                module: row.module,
                action: row.action
            }));
        } catch (error) {
            logger.error('Failed to get permissions', { apiKey, error });
            throw new Error(`${ErrorCode.DB_ERROR}: Failed to get permissions`);
        }
    }

    async hasPermission(apiKey: string, module: string, action: string): Promise<boolean> {
        try {
            const result = await this.pool.query(
                'SELECT 1 FROM permissions WHERE api_key = $1 AND module = $2 AND action = $3',
                [apiKey, module, action]
            );

            return result.rows.length > 0;
        } catch (error) {
            logger.error('Failed to check permission', { apiKey, module, action, error });
            throw new Error(`${ErrorCode.DB_ERROR}: Failed to check permission`);
        }
    }

    async close(): Promise<void> {
        await this.pool.end();
    }
}