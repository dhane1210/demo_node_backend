import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

export const config = {
    port: parseInt(process.env.PORT || '3000', 10),
    nodeEnv: process.env.NODE_ENV || 'development',
    isDev: process.env.NODE_ENV !== 'production',

    database: {
        path: process.env.DATABASE_PATH || './data/logistics.db',
    },

    sinay: {
        apiKey: process.env.SINAY_API_KEY || '',
        baseUrl: process.env.SINAY_API_BASE_URL || 'https://api.sinay.ai/container-tracking/api/v2',
    },

    webhook: {
        secret: process.env.WEBHOOK_SECRET || '',
    },

    smtp: {
        host: process.env.SMTP_HOST || 'smtp.example.com',
        port: parseInt(process.env.SMTP_PORT || '587', 10),
        secure: process.env.SMTP_SECURE === 'true',
        user: process.env.SMTP_USER || '',
        pass: process.env.SMTP_PASS || '',
        from: process.env.SMTP_FROM || 'noreply@logistics.com',
    },

    sync: {
        cronSchedule: process.env.SYNC_CRON_SCHEDULE || '0 */6 * * *',
    },

    auth: {
        adminUsername: process.env.ADMIN_USERNAME || 'admin',
        adminPassword: process.env.ADMIN_PASSWORD || 'envio2026',
    }
} as const;
