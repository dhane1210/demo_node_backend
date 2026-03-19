import { Router } from 'express';
import { ReportController } from './report.controller';

const router = Router();

router.get('/daily-summary', ReportController.getDailySummary);
router.get('/shipment/:id', ReportController.getShipmentReport);

export default router;
