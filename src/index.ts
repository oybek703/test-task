import { Database } from './database';
import { Cache } from './cache';
import { PermissionsService } from './service';
import { NatsHandler } from './nats-handler';
import { logger } from './logger';

async function main() {
    let db: Database | null = null;
    let cache: Cache | null = null;
    let natsHandler: NatsHandler | null = null;

    try {
        // Инициализация базы данных
        logger.info('Initializing database...');
        db = new Database();
        await db.init();

        // Инициализация кэша
        logger.info('Initializing cache...');
        cache = new Cache();
        await cache.init();

        // Инициализация сервиса
        logger.info('Initializing service...');
        const service = new PermissionsService(db, cache);

        // Инициализация NATS обработчика
        logger.info('Initializing NATS handler...');
        natsHandler = new NatsHandler(service);
        await natsHandler.init();

        logger.info('Permissions microservice started successfully');

        // Graceful shutdown
        process.on('SIGINT', async () => {
            logger.info('Shutting down...');

            if (natsHandler) await natsHandler.close();
            if (cache) await cache.close();
            if (db) await db.close();

            logger.info('Shutdown completed');
            process.exit(0);
        });

    } catch (error) {
        logger.error('Failed to start microservice', { error });

        // Cleanup on failure
        if (natsHandler) await natsHandler.close();
        if (cache) await cache.close();
        if (db) await db.close();

        process.exit(1);
    }
}

main();