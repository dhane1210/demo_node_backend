import { Request, Response } from 'express';
import { CommunicationService } from './communication.service';
import { ApiResponseHelper } from '../../utils/api-response';
import { asyncHandler } from '../../middleware/async-handler';

const commService = new CommunicationService();

export class CommunicationController {
    static getTemplates = asyncHandler(async (_req: Request, res: Response) => {
        const templates = await commService.getTemplates();
        ApiResponseHelper.success(res, templates);
    });

    static getTemplateWithData = asyncHandler(async (req: Request, res: Response) => {
        const shipment_id = typeof req.query.shipment_id === 'string' ? req.query.shipment_id : '';
        const template = await commService.getTemplateWithData(req.params.id as string, shipment_id);
        if (!template) { ApiResponseHelper.notFound(res, 'Email template'); return; }
        ApiResponseHelper.success(res, template);
    });

    static sendEmail = asyncHandler(async (req: Request, res: Response) => {
        const log = await commService.sendEmail(req.body);
        ApiResponseHelper.created(res, log);
    });

    static getEmailLogs = asyncHandler(async (req: Request, res: Response) => {
        const shipment_id = typeof req.query.shipment_id === 'string' ? req.query.shipment_id : undefined;
        const page = typeof req.query.page === 'string' ? parseInt(req.query.page) : 1;
        const limit = typeof req.query.limit === 'string' ? parseInt(req.query.limit) : 20;

        const result = await commService.getEmailLogs(
            shipment_id,
            page,
            limit
        );
        ApiResponseHelper.success(res, result);
    });
}
