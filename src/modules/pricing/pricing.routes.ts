import { Router } from 'express';
import { PricingController } from './pricing.controller';
import { validateRequest } from '../../middleware/validate-request';
import { createJobSchema, updateJobSchema, pricingInputSchema } from './pricing.validator';

const router = Router();

// Jobs
router.get('/jobs', PricingController.getJobs);
router.get('/jobs/:id', PricingController.getJobDetail);
router.post('/jobs', validateRequest(createJobSchema), PricingController.createJob);
router.patch('/jobs/:id', validateRequest(updateJobSchema), PricingController.updateJob);

// Pricing
router.post('/pricing/:jobId', validateRequest(pricingInputSchema), PricingController.calculatePricing);
router.get('/pricing/:jobId', PricingController.getPricing);

export default router;
