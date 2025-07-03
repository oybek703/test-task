import { connect, NatsConnection, JSONCodec } from 'nats';
import {
    GrantRequest,
    RevokeRequest,
    CheckRequest,
    ListRequest,
    SuccessResponse,
    CheckResponse,
    ListResponse,
    ErrorResponse
} from './types';

export class PermissionsClient {
    private nc: NatsConnection | null = null;
    private codec = JSONCodec();

    constructor(private natsUrl: string) {}

    async connect(): Promise<void> {
        this.nc = await connect({ servers: this.natsUrl });
    }

    async grant(request: GrantRequest): Promise<SuccessResponse | ErrorResponse> {
        if (!this.nc) throw new Error('Not connected to NATS');

        const response = await this.nc.request('permissions.grant', this.codec.encode(request));
        return this.codec.decode(response.data) as SuccessResponse | ErrorResponse;
    }

    async revoke(request: RevokeRequest): Promise<SuccessResponse | ErrorResponse> {
        if (!this.nc) throw new Error('Not connected to NATS');

        const response = await this.nc.request('permissions.revoke', this.codec.encode(request));
        return this.codec.decode(response.data) as SuccessResponse | ErrorResponse;
    }

    async check(request: CheckRequest): Promise<CheckResponse | ErrorResponse> {
        if (!this.nc) throw new Error('Not connected to NATS');

        const response = await this.nc.request('permissions.check', this.codec.encode(request));
        return this.codec.decode(response.data) as CheckResponse | ErrorResponse;
    }

    async list(request: ListRequest): Promise<ListResponse | ErrorResponse> {
        if (!this.nc) throw new Error('Not connected to NATS');

        const response = await this.nc.request('permissions.list', this.codec.encode(request));
        return this.codec.decode(response.data) as ListResponse | ErrorResponse;
    }

    async close(): Promise<void> {
        if (this.nc) {
            await this.nc.close();
        }
    }
}

// Экспорт всех типов для использования в других модулях
export * from './types';