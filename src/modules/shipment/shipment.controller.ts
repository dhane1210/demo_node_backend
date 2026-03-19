import { Request, Response } from 'express';
import { ShipmentService } from './shipment.service';
import { ApiResponseHelper } from '../../utils/api-response';
import { asyncHandler } from '../../middleware/async-handler';

const shipmentService = new ShipmentService();

/**
 * Shipment Controller — handles HTTP requests for shipment operations.
 */
export class ShipmentController {
    /**
     * GET /api/v1/shipments — Dashboard list with pagination.
     */
    static getDashboard = asyncHandler(async (req: Request, res: Response) => {
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 20;

        const { data, total } = await shipmentService.getDashboard(page, limit);
        ApiResponseHelper.paginated(res, data, total, page, limit);
    });

    /**
     * GET /api/v1/shipments/search — Search shipments.
     */
    static searchShipments = asyncHandler(async (req: Request, res: Response) => {
        const params = {
            q: req.query.q as string | undefined,
            bl_number: req.query.bl_number as string | undefined,
            shipment_number: req.query.shipment_number as string | undefined,
            container_number: req.query.container_number as string | undefined,
            vessel_name: req.query.vessel_name as string | undefined,
            customer_name: req.query.customer_name as string | undefined,
            date_from: req.query.date_from as string | undefined,
            date_to: req.query.date_to as string | undefined,
            status: req.query.status as string | undefined,
            tracking_id: req.query.tracking_id as string | undefined,
            page: parseInt(req.query.page as string) || 1,
            limit: parseInt(req.query.limit as string) || 20,
        };

        const { data, total } = await shipmentService.searchShipments(params);
        ApiResponseHelper.paginated(res, data, total, params.page, params.limit);
    });

    /**
     * GET /api/v1/shipments/:id — Full shipment detail.
     */
    static getShipmentDetail = asyncHandler(async (req: Request, res: Response) => {
        const detail = await shipmentService.getShipmentDetail(req.params.id as string);
        if (!detail) {
            ApiResponseHelper.notFound(res, 'Shipment');
            return;
        }
        ApiResponseHelper.success(res, detail);
    });

    /**
     * POST /api/v1/shipments — Create a new shipment.
     */
    static createShipment = asyncHandler(async (req: Request, res: Response) => {
        const shipment = await shipmentService.createShipment(req.body);
        ApiResponseHelper.created(res, shipment);
    });

    /**
     * PATCH /api/v1/shipments/:id — Update shipment (admin curation).
     */
    static updateShipment = asyncHandler(async (req: Request, res: Response) => {
        const shipment = await shipmentService.updateShipment(req.params.id as string, req.body);
        if (!shipment) {
            ApiResponseHelper.notFound(res, 'Shipment');
            return;
        }
        ApiResponseHelper.success(res, shipment);
    });

    /**
     * DELETE /api/v1/shipments/:id — Delete a shipment.
     */
    static deleteShipment = asyncHandler(async (req: Request, res: Response) => {
        await shipmentService.deleteShipment(req.params.id as string);
        ApiResponseHelper.success(res, { message: 'Shipment deleted successfully' });
    });

    /**
     * POST /api/v1/shipments/track — Manual tracking: fetch from Sinay API.
     */
    static trackShipment = asyncHandler(async (req: Request, res: Response) => {
        const { shipment_number, sealine } = req.body;
        const result = await shipmentService.trackShipment(shipment_number, sealine);
        ApiResponseHelper.success(res, result);
    });

    /**
     * GET /api/v1/shipments/dashboard — Summary statistics.
     */
    static getDashboardStats = asyncHandler(async (req: Request, res: Response) => {
        const stats = await shipmentService.getDashboardStats();
        ApiResponseHelper.success(res, stats);
    });
}
