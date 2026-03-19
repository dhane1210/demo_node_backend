import { Request, Response } from 'express';
import { logger } from '../../utils/logger';
import { ApiResponseHelper } from '../../utils/api-response';
import { asyncHandler } from '../../middleware/async-handler';
import { WebhookHandler } from './webhook-handler';

const webhookHandler = new WebhookHandler();

export class WebhookController {
    /**
     * POST /api/v1/webhooks/sinay — Receives Svix-signed webhook payloads from Sinay.
     */
    static handleSinayWebhook = asyncHandler(async (req: Request, res: Response) => {
        const payload = req.body;
        const eventType = req.headers['svix-event-type'] as string || payload?.eventType || 'unknown';

        logger.info(`Webhook received: ${eventType}`);

        try {
            await webhookHandler.processEvent(eventType, payload);
            ApiResponseHelper.success(res, { received: true, eventType });
        } catch (error: any) {
            logger.error('Webhook processing error:', error);
            // Still return 200 to prevent retries for processing errors
            ApiResponseHelper.success(res, { received: true, eventType, error: error.message });
        }
    });

    static getWebhookLogs = asyncHandler(async (req: Request, res: Response) => {
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 20;
        const result = await webhookHandler.getLogs(page, limit);
        ApiResponseHelper.paginated(res, result.data, result.total, page, limit);
    });
}
