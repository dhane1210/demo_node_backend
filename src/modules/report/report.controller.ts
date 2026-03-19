import { Request, Response } from 'express';
import { ReportService } from './report.service';
import { ApiResponseHelper } from '../../utils/api-response';
import { asyncHandler } from '../../middleware/async-handler';

const reportService = new ReportService();

export class ReportController {
    static getDailySummary = asyncHandler(async (req: Request, res: Response) => {
        const { customer_id, date } = req.query;
        const doc = await reportService.generateDailySummary(customer_id as string, date as string);

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=daily-summary-${date || new Date().toISOString().split('T')[0]}.pdf`);
        doc.pipe(res);
        doc.end();
    });

    static getShipmentReport = asyncHandler(async (req: Request, res: Response) => {
        const doc = await reportService.generateShipmentReport(req.params.id as string);
        if (!doc) {
            ApiResponseHelper.notFound(res, 'Shipment');
            return;
        }

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=shipment-${req.params.id}.pdf`);
        doc.pipe(res);
        doc.end();
    });
}
