import { Router } from 'express';
import { AssignmentController } from './assignment.controller';

const router = Router();

router.get('/', AssignmentController.getAllAssignments);
router.post('/', AssignmentController.createAssignment);
router.post('/:id/send', AssignmentController.sendEmail);
router.get('/:trackingId', AssignmentController.getByTrackingId);
router.delete('/:id', AssignmentController.deleteAssignment);

export default router;
