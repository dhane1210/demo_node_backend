import { ShipmentService } from './shipment.service';
import { logger } from '../../utils/logger';

export class SyncService {
    private shipmentService: ShipmentService;
    private isSyncing: boolean = false;

    constructor() {
        this.shipmentService = new ShipmentService();
    }

    /**
     * Sync all active shipments by pulling latest data from API.
     */
    async syncActiveShipments() {
        if (this.isSyncing) {
            logger.warn('Sync already in progress, skipping...');
            return;
        }

        this.isSyncing = true;
        logger.info('Starting 6-hour shipment sync...');

        try {
            const activeShipments = await this.shipmentService.getActiveShipments();
            logger.info(`Found ${activeShipments.length} active shipments to sync.`);

            for (const shipment of activeShipments) {
                if (!shipment.shipment_number) continue;

                try {
                    logger.info(`Syncing shipment: ${shipment.shipment_number}`);
                    await this.shipmentService.trackShipment(shipment.shipment_number, shipment.sealine || undefined);
                    // Add a small delay between requests to avoid rate limiting
                    await new Promise(resolve => setTimeout(resolve, 2000));
                } catch (error) {
                    logger.error(`Failed to sync shipment ${shipment.shipment_number}:`, error);
                }
            }

            logger.info('Shipment sync completed successfully.');
        } catch (error) {
            logger.error('Error during active shipment sync:', error);
        } finally {
            this.isSyncing = false;
        }
    }

    /**
     * Start the background sync loop (every 6 hours).
     */
    startSyncLoop() {
        const SIX_HOURS_MS = 6 * 60 * 60 * 1000;

        // Run immediately on start
        this.syncActiveShipments();

        // Then every 6 hours
        setInterval(() => {
            this.syncActiveShipments();
        }, SIX_HOURS_MS);

        logger.info('6-hour sync loop initialized.');
    }
}

export const syncService = new SyncService();
