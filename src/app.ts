import express from 'express';
import path from 'path';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import { requestLogger } from './middleware/request-logger';
import { errorHandler } from './middleware/error-handler';
import { ApiResponseHelper } from './utils/api-response';

// Module routes
import shipmentRoutes from './modules/shipment/shipment.routes';
import calendarRoutes from './modules/calendar/calendar.routes';
import alertRoutes from './modules/alert/alert.routes';
import communicationRoutes from './modules/communication/communication.routes';
import reportRoutes from './modules/report/report.routes';
import pricingRoutes from './modules/pricing/pricing.routes';
import inquiryRoutes from './modules/inquiry/inquiry.routes';
import assignmentRoutes from './modules/shipment/assignment.routes';
import customerRoutes from './modules/customer/customer.routes';
import webhookRoutes from './integrations/webhook/webhook.routes';
import authRoutes from './modules/auth/auth.routes';

const app = express();

// ─── Security & Compression ────────────────────────────
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "'unsafe-inline'", "cdn.jsdelivr.net", "unpkg.com"],
            styleSrc: ["'self'", "'unsafe-inline'", "cdn.jsdelivr.net", "unpkg.com"],
            fontSrc: ["'self'", "cdn.jsdelivr.net"],
            imgSrc: ["'self'", "data:", "tile.openstreetmap.org", "*.tile.openstreetmap.org", "a.tile.openstreetmap.org", "b.tile.openstreetmap.org", "c.tile.openstreetmap.org", "unpkg.com"],
            connectSrc: ["'self'"],
        },
    },
}));
app.use(cors());
app.use(compression());

// ─── Rate Limiting ─────────────────────────────────────
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 500, // limit each IP to 500 requests per windowMs
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, error: 'Too many requests, please try again later.' },
});
app.use(limiter);

// ─── Body Parsing ──────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ─── Static Files (Test UI) ────────────────────────────
app.use(express.static(path.join(process.cwd(), 'public')));

// ─── Logging ───────────────────────────────────────────
app.use(requestLogger);

// ─── Health Check ──────────────────────────────────────
app.get('/api/v1/health', (_req, res) => {
    ApiResponseHelper.success(res, {
        status: 'healthy',
        uptime: process.uptime(),
        timestamp: new Date().toISOString(),
        version: '1.0.0',
    });
});

// ─── API Routes ────────────────────────────────────────
app.use('/api/v1/shipments', shipmentRoutes);
app.use('/api/v1/calendar', calendarRoutes);
app.use('/api/v1/alerts', alertRoutes);
app.use('/api/v1/communications', communicationRoutes);
app.use('/api/v1/reports', reportRoutes);
app.use('/api/v1/inquiries', inquiryRoutes);
app.use('/api/v1/assignments', assignmentRoutes);
app.use('/api/v1/customers', customerRoutes);
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1', pricingRoutes);       // /api/v1/jobs & /api/v1/pricing
app.use('/api/v1/webhooks', webhookRoutes);

// ─── 404 Handler ───────────────────────────────────────
app.use((_req, res) => {
    ApiResponseHelper.error(res, 'Route not found', 404);
});

// ─── Global Error Handler ──────────────────────────────
app.use(errorHandler);

export default app;
