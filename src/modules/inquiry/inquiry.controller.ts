import { Request, Response } from 'express';
import { InquiryService } from './inquiry.service';
import { ApiResponseHelper } from '../../utils/api-response';
import { asyncHandler } from '../../middleware/async-handler';

const inquiryService = new InquiryService();

export class InquiryController {
    static getAllInquiries = asyncHandler(async (req: Request, res: Response) => {
        const { status, page, limit } = req.query;
        const result = await inquiryService.getAllInquiries(
            status as string,
            parseInt(page as string) || 1,
            parseInt(limit as string) || 20
        );
        ApiResponseHelper.paginated(res, result.data, result.total, parseInt(page as string) || 1, parseInt(limit as string) || 20);
    });

    static getInquiryById = asyncHandler(async (req: Request, res: Response) => {
        const inquiry = await inquiryService.getInquiryById(req.params.id as string);
        if (!inquiry) { ApiResponseHelper.notFound(res, 'Inquiry'); return; }
        ApiResponseHelper.success(res, inquiry);
    });

    static trackInquiry = asyncHandler(async (req: Request, res: Response) => {
        const data = await inquiryService.trackInquiry(req.params.trackingId as string);
        if (!data) { ApiResponseHelper.notFound(res, 'Inquiry Tracking ID'); return; }
        ApiResponseHelper.success(res, data);
    });

    static createInquiry = asyncHandler(async (req: Request, res: Response) => {
        const inquiry = await inquiryService.createInquiry(req.body);
        ApiResponseHelper.created(res, inquiry);
    });

    static respondToInquiry = asyncHandler(async (req: Request, res: Response) => {
        const inquiry = await inquiryService.respondToInquiry(req.params.id as string, req.body);
        if (!inquiry) { ApiResponseHelper.notFound(res, 'Inquiry'); return; }
        ApiResponseHelper.success(res, inquiry);
    });

    static linkShipment = asyncHandler(async (req: Request, res: Response) => {
        const { shipment_id } = req.body;
        const inquiry = await inquiryService.linkInquiryToShipment(req.params.id as string, shipment_id);
        if (!inquiry) { ApiResponseHelper.notFound(res, 'Inquiry'); return; }
        ApiResponseHelper.success(res, inquiry);
    });
}
