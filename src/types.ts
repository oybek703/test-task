// Базовые типы
export interface Permission {
    module: string;
    action: string;
}

export interface PermissionWithApiKey extends Permission {
    apiKey: string;
}

// Сообщения для NATS
export interface GrantRequest {
    apiKey: string;
    module: string;
    action: string;
}

export interface RevokeRequest {
    apiKey: string;
    module: string;
    action: string;
}

export interface CheckRequest {
    apiKey: string;
    module: string;
    action: string;
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