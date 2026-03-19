import { Router } from 'express';
import { InquiryController } from './inquiry.controller';
import { validateRequest } from '../../middleware/validate-request';
import { createInquirySchema, respondInquirySchema, linkInquirySchema } from './inquiry.validator';

const router = Router();

// Admin routes
router.get('/', InquiryController.getAllInquiries);
router.get('/:id', InquiryController.getInquiryById);
router.patch('/:id/respond', validateRequest(respondInquirySchema), InquiryController.respondToInquiry);
router.patch('/:id/link-shipment', validateRequest(linkInquirySchema), InquiryController.linkShipment);

// Public / Customer routes
router.post('/', validateRequest(createInquirySchema), InquiryController.createInquiry);
router.get('/track/:trackingId', InquiryController.trackInquiry);

export default router;
