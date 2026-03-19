import { ShipmentRepository } from './shipment.repository';
import { CalendarRepository } from '../calendar/calendar.repository';
import { ShipmentRow, ShipmentSearchParams } from './shipment.types';
import { getSinayClient } from '../../integrations/sinay/sinay.client';
import { SinayMapper } from '../../integrations/sinay/sinay.mapper';
import { logger } from '../../utils/logger';

/**
 * Shipment Service — business logic for shipment operations.
 */
export class ShipmentService {
    private repository: ShipmentRepository;
    private calendarRepository: CalendarRepository;

    constructor() {
        this.repository = new ShipmentRepository();
        this.calendarRepository = new CalendarRepository();
    }

    /**
     * Get all shipments with pagination (dashboard list).
     */
    async getDashboard(page: number = 1, limit: number = 20) {
        return this.repository.findAll(page, limit);
    }

    /**
     * Get full shipment details by ID.
     */
    async getShipmentDetail(id: string) {
        const shipment = this.repository.findById(id);
        if (!shipment) return null;

        const containers = this.repository.findContainersByShipmentId(id);
        const events = this.repository.findEventsByShipmentId(id);
        const routeSegments = this.repository.findRouteSegmentsByShipmentId(id);
        const documents = new (require('./document.repository').DocumentRepository)().findByShipmentId(id);

        let sinayData = null;
        if (shipment.raw_api_response) {
            try {
                sinayData = JSON.parse(shipment.raw_api_response);
            } catch (e) {
                logger.error('Failed to parse raw_api_response for shipment ' + id);
            }
        }

        return {
            ...shipment,
            containers,
            events,
            routeSegments,
            documents,
            sinayData,
        };
    }

    /**
     * Search shipments by various criteria.
     */
    async searchShipments(params: ShipmentSearchParams) {
        return this.repository.search(params);
    }

    /**
     * Create a new shipment manually.
     */
    async createShipment(data: Partial<ShipmentRow>) {
        return this.repository.create(data);
    }

    /**
     * Update a shipment (admin curation — adjust ETA, status, notes).
     */
    async updateShipment(id: string, updates: Partial<ShipmentRow>) {
        return this.repository.update(id, updates);
    }

    /**
     * Delete a shipment.
     */
    async deleteShipment(id: string) {
        return this.repository.delete(id);
    }

    /**
     * Track a shipment — fetch latest data from Sinay API and store it.
     * This is the manual search/track endpoint.
     */
    async trackShipment(shipmentNumber: string, sealine?: string) {
        try {
            const client = getSinayClient();
            const apiResponse = await client.getShipmentDetail({
                shipmentNumber,
                sealine,
                route: true,
                ais: true,
            });

            // Check if shipment already exists
            let existingShipment = this.repository.findByShipmentNumber(shipmentNumber);
            const shipmentData = SinayMapper.mapToShipment(apiResponse, existingShipment?.id);

            let shipment: ShipmentRow;

            if (existingShipment) {
                // Update existing shipment
                shipment = this.repository.update(existingShipment.id, shipmentData)!;

                // Clear and re-insert related data
                this.repository.deleteContainersByShipmentId(existingShipment.id);
                this.repository.deleteEventsByShipmentId(existingShipment.id);
                this.repository.deleteRouteSegmentsByShipmentId(existingShipment.id);
            } else {
                // Create new shipment
                shipment = this.repository.create(shipmentData);
            }

            // Insert containers
            const containers = SinayMapper.mapContainers(apiResponse, shipment.id);
            const containerIdMap = new Map<string, string>();
            for (const container of containers) {
                this.repository.createContainer(container);
                containerIdMap.set(container.number, container.id);
            }

            // Insert container events
            const events = SinayMapper.mapContainerEvents(apiResponse, shipment.id, containerIdMap);
            for (const event of events) {
                this.repository.createContainerEvent(event);
            }

            // Insert route segments
            const routeSegments = SinayMapper.mapRouteSegments(apiResponse, shipment.id);
            for (const segment of routeSegments) {
                this.repository.createRouteSegment(segment);
            }

            logger.info(`Shipment ${shipmentNumber} tracked successfully`);

            // Trigger calendar sync
            this.calendarRepository.syncFromShipments();

            return this.getShipmentDetail(shipment.id);
        } catch (error: any) {
            if (error.response?.data) {
                logger.error(`Sinay API error detail:`, error.response.data);
                throw new Error(`Tracking failed: ${error.response.data.error || error.response.data.message || error.message}`);
            }
            logger.error(`Failed to track shipment ${shipmentNumber}:`, error);
            throw new Error(`Failed to track shipment: ${error.message}`);
        }
    }

    /**
     * Get active (non-completed) shipments for sync operations.
     */
    async getActiveShipments() {
        return this.repository.findActiveShipments();
    }

    /**
     * Get dashboard summary statistics.
     */
    async getDashboardStats() {
        return this.repository.getDashboardStats();
    }
}
