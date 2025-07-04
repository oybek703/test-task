import { Database } from './database';
import { Cache } from './cache';
import { logger } from './logger';
import {
    GrantRequest,
    RevokeRequest,
    CheckRequest,
    ListRequest,
    SuccessResponse,
    CheckResponse,
    ListResponse,
    ErrorResponse,
    ErrorCode
} from './types';

export class PermissionsService {
    constructor(
        private db: Database,
        private cache: Cache
    ) {}

    async grant(request: GrantRequest): Promise<SuccessResponse | ErrorResponse> {
        try {
            logger.info('Grant request received', request);

            // Валидация
            if (!request.apiKey || !request.module || !request.action) {
                return {
                    error: {
                        code: ErrorCode.INVALID_PAYLOAD,
                        message: 'Missing required fields: apiKey, module, action'
                    }
                };
            }

            // Сохранение в базу данных
            await this.db.grantPermission(request.apiKey, request.module, request.action);

            // Обновление кэша
            await this.updateCache(request.apiKey);

            logger.info('Permission granted successfully', request);
            return { status: 'ok' };
        } catch (error) {
            logger.error('Grant operation failed', { request, error });
            return this.handleError(error);
        }
    }

    async revoke(request: RevokeRequest): Promise<SuccessResponse | ErrorResponse> {
        try {
            logger.info('Revoke request received', request);

            // Валидация
            if (!request.apiKey || !request.module || !request.action) {
                return {
                    error: {
                        code: ErrorCode.INVALID_PAYLOAD,
                        message: 'Missing required fields: apiKey, module, action'
                    }
                };
            }

            // Удаление из базы данных
            await this.db.revokePermission(request.apiKey, request.module, request.action);

            // Обновление кэша
            await this.updateCache(request.apiKey);

            logger.info('Permission revoked successfully', request);
            return { status: 'ok' };
        } catch (error) {
            logger.error('Revoke operation failed', { request, error });
            return this.handleError(error);
        }
    }

    async check(request: CheckRequest): Promise<CheckResponse | ErrorResponse> {
        try {
            logger.info('Check request received', request);

            // Валидация
            if (!request.apiKey || !request.module || !request.action) {
                return {
                    error: {
                        code: ErrorCode.INVALID_PAYLOAD,
                        message: 'Missing required fields: apiKey, module, action'
                    }
                };
            }

            // Попытка получить из кэша
            let permissions = await this.cache.getPermissions(request.apiKey);

            if (!permissions) {
                // Загрузка из базы данных
                permissions = await this.db.getPermissions(request.apiKey);

                // Кэширование
                await this.cache.setPermissions(request.apiKey, permissions);
            }

            const permissionsSet = new Set(permissions.map(p => `${p.module}:${p.action}`));
            const allowed = permissionsSet.has(`${request.module}:${request.action}`);

            logger.info('Permission check completed', { ...request, allowed });
            return { allowed };
        } catch (error) {
            logger.error('Check operation failed', { request, error });
            return this.handleError(error);
        }
    }

    async list(request: ListRequest): Promise<ListResponse | ErrorResponse> {
        try {
            logger.info('List request received', request);

            // Валидация
            if (!request.apiKey) {
                return {
                    error: {
                        code: ErrorCode.INVALID_PAYLOAD,
                        message: 'Missing required field: apiKey'
                    }
                };
            }

            // Попытка получить из кэша
            let permissions = await this.cache.getPermissions(request.apiKey);

            if (!permissions) {
                // Загрузка из базы данных
                permissions = await this.db.getPermissions(request.apiKey);

                // Кэширование
                await this.cache.setPermissions(request.apiKey, permissions);
            }

            logger.info('Permissions list retrieved', { apiKey: request.apiKey, count: permissions.length });
            return { permissions };
        } catch (error) {
            logger.error('List operation failed', { request, error });
            return this.handleError(error);
        }
    }

    private async updateCache(apiKey: string): Promise<void> {
        try {
            const permissions = await this.db.getPermissions(apiKey);
            await this.cache.setPermissions(apiKey, permissions);
        } catch (error) {
            logger.error('Failed to update cache', { apiKey, error });
            // Не бросаем ошибку, так как это не критично
        }
    }

    private handleError(error: any): ErrorResponse {
        if (error.message && error.message.includes('permission_not_found')) {
            return {
                error: {
                    code: ErrorCode.PERMISSION_NOT_FOUND,
                    message: 'Permission not found'
                }
            };
        }

        if (error.message && error.message.includes('db_error')) {
            return {
                error: {
                    code: ErrorCode.DB_ERROR,
                    message: 'Database operation failed'
                }
            };
        }

        if (error.message && error.message.includes('cache_error')) {
            return {
                error: {
                    code: ErrorCode.CACHE_ERROR,
                    message: 'Cache operation failed'
                }
            };
        }

        return {
            error: {
                code: ErrorCode.INTERNAL_ERROR,
                message: 'Internal server error'
            }
        };
    }
}