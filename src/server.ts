import { config } from './config';
import { logger } from './utils/logger';
import {
    initializeDatabase,
    startAutoSave,
    saveDatabase
} from './config/database';
import { runMigrations } from './database/migrations';
import { seedDatabase } from './database/seeds';
import { startSyncJob } from './jobs/sync-shipments.job';
import app from './app';

async function bootstrap(): Promise<void> {
    try {
        logger.info('🚀 Starting Logistics Tracking Backend...');
        logger.info(Environment: ${config.nodeEnv});

        // Initialize database
        logger.info('Initializing database...');
        await initializeDatabase();

        logger.info('Running migrations...');
        await runMigrations();

        logger.info('Seeding database...');
        await seedDatabase();

        logger.info('Starting auto-save...');
        startAutoSave();

        // Start background jobs
        logger.info('Starting sync job...');
        startSyncJob();

        // Start server (IMPORTANT: bind to 0.0.0.0)
        app.listen(config.port, '0.0.0.0', () => {
            logger.info(🚀 Server running on port ${config.port});
        });

        // Graceful shutdown
        const shutdown = async () => {
            try {
                logger.info('Shutting down gracefully...');
                saveDatabase();
                process.exit(0);
            } catch (err) {
                logger.error('Error during shutdown:', err);
                process.exit(1);
            }
        };

        process.on('SIGINT', shutdown);
        process.on('SIGTERM', shutdown);

    } catch (error) {
        logger.error('❌ Failed to start server:', error);
        process.exit(1);
    }
}

bootstrap();
