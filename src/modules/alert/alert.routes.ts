import { Router } from 'express';
import { AlertController } from './alert.controller';

const router = Router();

router.get('/', AlertController.getDashboard);
router.get('/:id', AlertController.getDetail);
router.post('/', AlertController.createAlert);
router.patch('/:id', AlertController.updateAlert);
router.patch('/:id/acknowledge', AlertController.acknowledgeAlert);
router.patch('/:id/resolve', AlertController.resolveAlert);

export default router;
