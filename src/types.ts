// Метаданные разрешений
export const MODULE_ACTIONS = {
    trades: ['create', 'create-manual'],
    inventory: ['create', 'read', 'update', 'delete']
} as const;

export type ModuleName = keyof typeof MODULE_ACTIONS;
export type ActionOf<M extends ModuleName> = typeof MODULE_ACTIONS[M][number];

// Базовые типы
export interface Permission<M extends ModuleName = ModuleName> {
    module: M;
    action: ActionOf<M>;
}

// Define a type for permissions hash map
export type PermissionsMap = Record<string, boolean>;

// Сообщения для NATS
export interface GrantRequest<M extends ModuleName = ModuleName> {
    apiKey: string;
    module: M;
    action: ActionOf<M>;
}

export interface RevokeRequest<M extends ModuleName = ModuleName> {
    apiKey: string;
    module: M;
    action: ActionOf<M>;
}

export interface CheckRequest<M extends ModuleName = ModuleName> {
    apiKey: string;
    module: M;
    action: ActionOf<M>;
}

export interface ListRequest {
    apiKey: string;
}

// Ответы
export interface SuccessResponse {
    status: 'ok';
}

export interface CheckResponse {
    allowed: boolean;
}

export interface ListResponse {
    permissions: Permission[];
}

export interface ErrorResponse {
    error: {
        code: ErrorCode;
        message: string;
    };
}

// Коды ошибок
export enum ErrorCode {
    APIKEY_NOT_FOUND = 'apiKey_not_found',
    DB_ERROR = 'db_error',
    CACHE_ERROR = 'cache_error',
    INVALID_PAYLOAD = 'invalid_payload',
    INTERNAL_ERROR = 'internal_error',
    PERMISSION_NOT_FOUND = 'permission_not_found'
}

// Конфигурация
export interface Config {
    nats: {
        url: string;
    };
    postgres: {
        host: string;
        port: number;
        database: string;
        username: string;
        password: string;
    };
    cache: {
        bucket: string;
    };
}