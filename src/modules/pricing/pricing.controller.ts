import { Request, Response } from 'express';
import { PricingService } from './pricing.service';
import { ApiResponseHelper } from '../../utils/api-response';
import { asyncHandler } from '../../middleware/async-handler';

const pricingService = new PricingService();

export class PricingController {
    // ─── Jobs ─────────────────────────────────────────────

    static getJobs = asyncHandler(async (req: Request, res: Response) => {
        const { status, page, limit } = req.query;
        const result = await pricingService.getJobs(
            status as string, parseInt(page as string) || 1, parseInt(limit as string) || 20
        );
        ApiResponseHelper.paginated(res, result.data, result.total,
            parseInt(page as string) || 1, parseInt(limit as string) || 20);
    });

    static getJobDetail = asyncHandler(async (req: Request, res: Response) => {
        const job = await pricingService.getJobDetail(req.params.id as string);
        if (!job) { ApiResponseHelper.notFound(res, 'Job'); return; }
        ApiResponseHelper.success(res, job);
    });

    static createJob = asyncHandler(async (req: Request, res: Response) => {
        const job = await pricingService.createJob(req.body);
        ApiResponseHelper.created(res, job);
    });

    static updateJob = asyncHandler(async (req: Request, res: Response) => {
        const job = await pricingService.updateJob(req.params.id as string, req.body);
        if (!job) { ApiResponseHelper.notFound(res, 'Job'); return; }
        ApiResponseHelper.success(res, job);
    });

    // ─── Pricing ──────────────────────────────────────────

    static calculatePricing = asyncHandler(async (req: Request, res: Response) => {
        const pricing = await pricingService.calculatePricing(req.params.jobId as string, req.body);
        if (!pricing) { ApiResponseHelper.notFound(res, 'Job'); return; }
        ApiResponseHelper.success(res, pricing);
    });

    static getPricing = asyncHandler(async (req: Request, res: Response) => {
        const pricing = await pricingService.getPricing(req.params.jobId as string);
        if (!pricing) { ApiResponseHelper.notFound(res, 'Pricing'); return; }
        ApiResponseHelper.success(res, pricing);
    });
}
