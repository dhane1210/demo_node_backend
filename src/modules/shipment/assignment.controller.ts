import { Request, Response } from 'express';
import { AssignmentService } from './assignment.service';
import { ApiResponseHelper } from '../../utils/api-response';
import { asyncHandler } from '../../middleware/async-handler';

const assignmentService = new AssignmentService();

export class AssignmentController {
    static getAllAssignments = asyncHandler(async (req: Request, res: Response) => {
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 20;
        const customerId = req.query.customer_id as string | undefined;
        const shipmentId = req.query.shipment_id as string | undefined;
        const { data, total } = await assignmentService.getAllAssignments(page, limit, customerId, shipmentId);
        ApiResponseHelper.paginated(res, data, total, page, limit);
    });

    static createAssignment = asyncHandler(async (req: Request, res: Response) => {
        const assignment = await assignmentService.createAssignment(req.body);
        ApiResponseHelper.created(res, assignment);
    });

    static getByTrackingId = asyncHandler(async (req: Request, res: Response) => {
        const assignment = await assignmentService.getAssignmentByTrackingId(req.params.trackingId as string);
        if (!assignment) {
            ApiResponseHelper.notFound(res, 'Assignment');
            return;
        }
        ApiResponseHelper.success(res, assignment);
    });

    static deleteAssignment = asyncHandler(async (req: Request, res: Response) => {
        await assignmentService.deleteAssignment(req.params.id as string);
        ApiResponseHelper.success(res, { message: 'Assignment deleted' });
    });

    static sendEmail = asyncHandler(async (req: Request, res: Response) => {
        await assignmentService.sendAssignmentEmail(req.params.id as string);
        ApiResponseHelper.success(res, { message: 'Email sent successfully' });
    });
}
