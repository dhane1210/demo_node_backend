import { Router } from 'express';
import { CommunicationController } from './communication.controller';

const router = Router();

router.get('/templates', CommunicationController.getTemplates);
router.get('/templates/:id', CommunicationController.getTemplateWithData);
router.post('/send', CommunicationController.sendEmail);
router.get('/logs', CommunicationController.getEmailLogs);

export default router;
