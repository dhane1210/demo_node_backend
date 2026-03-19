import { Request, Response } from 'express';
import { AlertService } from './alert.service';
import { ApiResponseHelper } from '../../utils/api-response';
import { asyncHandler } from '../../middleware/async-handler';

const alertService = new AlertService();

export class AlertController {
    static getDashboard = asyncHandler(async (req: Request, res: Response) => {
        const { status, severity, page, limit } = req.query;
        const result = await alertService.getDashboard(
            status as string, severity as string,
            parseInt(page as string) || 1, parseInt(limit as string) || 20
        );
        ApiResponseHelper.paginated(res, result.data, result.total,
            parseInt(page as string) || 1, parseInt(limit as string) || 20);
    });

    static getDetail = asyncHandler(async (req: Request, res: Response) => {
        const alert = await alertService.getAlertDetail(req.params.id as string);
        if (!alert) { ApiResponseHelper.notFound(res, 'Alert'); return; }
        ApiResponseHelper.success(res, alert);
    });

    static createAlert = asyncHandler(async (req: Request, res: Response) => {
        const alert = await alertService.createAlert(req.body);
        ApiResponseHelper.created(res, alert);
    });

    static updateAlert = asyncHandler(async (req: Request, res: Response) => {
        const alert = await alertService.updateAlert(req.params.id as string, req.body);
        if (!alert) { ApiResponseHelper.notFound(res, 'Alert'); return; }
        ApiResponseHelper.success(res, alert);
    });

    static acknowledgeAlert = asyncHandler(async (req: Request, res: Response) => {
        const { action_taken } = req.body;
        const alert = await alertService.acknowledgeAlert(req.params.id as string, action_taken);
        if (!alert) { ApiResponseHelper.notFound(res, 'Alert'); return; }
        ApiResponseHelper.success(res, alert);
    });

    static resolveAlert = asyncHandler(async (req: Request, res: Response) => {
        const { resolved_by, action_taken } = req.body;
        const alert = await alertService.resolveAlert(req.params.id as string, resolved_by || 'System', action_taken);
        if (!alert) { ApiResponseHelper.notFound(res, 'Alert'); return; }
        ApiResponseHelper.success(res, alert);
    });
}
