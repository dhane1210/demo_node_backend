import { config } from './config';
import { logger } from './utils/logger';
import { initializeDatabase, startAutoSave, saveDatabase } from './config/database';
import { runMigrations } from './database/migrations';
import { seedDatabase } from './database/seeds';
import { startSyncJob } from './jobs/sync-shipments.job';
import app from './app';

async function bootstrap(): Promise<void> {
    try {
        logger.info('🚀 Starting Logistics Tracking Backend...');
        logger.info(`Environment: ${config.nodeEnv}`);

        // Initialize database
        await initializeDatabase();
        runMigrations();
        seedDatabase();
        startAutoSave();

        // Start periodic sync job
        startSyncJob();

        // Start server
        app.listen(config.port, () => {
            logger.info(`✅ Server running on http://localhost:${config.port}`);
            logger.info(`📋 Health check: http://localhost:${config.port}/api/v1/health`);
            logger.info(`📦 Shipments API: http://localhost:${config.port}/api/v1/shipments`);
            logger.info(`📅 Calendar API: http://localhost:${config.port}/api/v1/calendar/events`);
            logger.info(`🔔 Alerts API: http://localhost:${config.port}/api/v1/alerts`);
            logger.info(`📧 Communications: http://localhost:${config.port}/api/v1/communications/templates`);
            logger.info(`📄 Reports API: http://localhost:${config.port}/api/v1/reports/daily-summary`);
            logger.info(`💰 Pricing API: http://localhost:${config.port}/api/v1/jobs`);
            logger.info(`🔗 Webhooks: http://localhost:${config.port}/api/v1/webhooks/sinay`);
        });

        // Graceful shutdown
        const shutdown = async () => {
            logger.info('Shutting down gracefully...');
            saveDatabase();
            process.exit(0);
        };

        process.on('SIGINT', shutdown);
        process.on('SIGTERM', shutdown);

    } catch (error) {
        logger.error('Failed to start server:', error);
        process.exit(1);
    }
}

bootstrap();
