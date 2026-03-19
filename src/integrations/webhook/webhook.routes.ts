import { Router } from 'express';
import { WebhookController } from './webhook.controller';

const router = Router();

router.post('/sinay', WebhookController.handleSinayWebhook);
router.get('/logs', WebhookController.getWebhookLogs);

export default router;