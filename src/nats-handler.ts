import { connect, NatsConnection, JSONCodec } from 'nats';
import { config } from './config';
import { logger } from './logger';
import { PermissionsService } from './service';
import {
    GrantRequest,
    RevokeRequest,
    CheckRequest,
    ListRequest
} from './types';

export class NatsHandler {
    private nc: NatsConnection | null = null;
    private codec = JSONCodec();

    constructor(private service: PermissionsService) {}

    async init(): Promise<void> {
        try {
            this.nc = await connect({ servers: config.nats.url });
            logger.info('Connected to NATS');

            // Подписка на темы
            await this.setupSubscriptions();

            logger.info('NATS subscriptions setup completed');
        } catch (error) {
            logger.error('Failed to initialize NATS handler', { error });
            throw error;
        }
    }

    private async setupSubscriptions(): Promise<void> {
        if (!this.nc) throw new Error('NATS connection not initialized');

        // permissions.grant
        this.nc.subscribe('permissions.grant', {
            callback: async (err, msg) => {
                if (err) {
                    logger.error('Grant subscription error', { error: err });
                    return;
                }

                try {
                    const request = this.codec.decode(msg.data) as GrantRequest;
                    const response = await this.service.grant(request);
                    msg.respond(this.codec.encode(response));
                } catch (error) {
                    logger.error('Grant handler error', { error });
                    msg.respond(this.codec.encode({
                        error: {
                            code: 'internal_error',
                            message: 'Internal server error'
                        }
                    }));
                }
            }
        });

        // permissions.revoke
        this.nc.subscribe('permissions.revoke', {
            callback: async (err, msg) => {
                if (err) {
                    logger.error('Revoke subscription error', { error: err });
                    return;
                }

                try {
                    const request = this.codec.decode(msg.data) as RevokeRequest;
                    const response = await this.service.revoke(request);
                    msg.respond(this.codec.encode(response));
                } catch (error) {
                    logger.error('Revoke handler error', { error });
                    msg.respond(this.codec.encode({
                        error: {
                            code: 'internal_error',
                            message: 'Internal server error'
                        }
                    }));
                }
            }
        });

        // permissions.check
        this.nc.subscribe('permissions.check', {
            callback: async (err, msg) => {
                if (err) {
                    logger.error('Check subscription error', { error: err });
                    return;
                }

                try {
                    const request = this.codec.decode(msg.data) as CheckRequest;
                    const response = await this.service.check(request);
                    msg.respond(this.codec.encode(response));
                } catch (error) {
                    logger.error('Check handler error', { error });
                    msg.respond(this.codec.encode({
                        error: {
                            code: 'internal_error',
                            message: 'Internal server error'
                        }
                    }));
                }
            }
        });

        // permissions.list
        this.nc.subscribe('permissions.list', {
            callback: async (err, msg) => {
                if (err) {
                    logger.error('List subscription error', { error: err });
                    return;
                }

                try {
                    const request = this.codec.decode(msg.data) as ListRequest;
                    const response = await this.service.list(request);
                    msg.respond(this.codec.encode(response));
                } catch (error) {
                    logger.error('List handler error', { error });
                    msg.respond(this.codec.encode({
                        error: {
                            code: 'internal_error',
                            message: 'Internal server error'
                        }
                    }));
                }
            }
        });
    }

    async close(): Promise<void> {
        if (this.nc) {
            await this.nc.close();
        }
    }
}