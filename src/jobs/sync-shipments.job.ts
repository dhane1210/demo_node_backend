import cron from 'node-cron';
import { v4 as uuidv4 } from 'uuid';
import { ShipmentService } from '../modules/shipment/shipment.service';
import { AlertRepository } from '../modules/alert/alert.repository';
import { getDatabase, saveDatabase } from '../config/database';
import { logger } from '../utils/logger';
import { config } from '../config';

const shipmentService = new ShipmentService();
const alertRepository = new AlertRepository();

/**
 * Periodic shipment sync job.
 * Fetches latest tracking data from Sinay API for all active shipments.
 */
export function startSyncJob(): void {
    const schedule = config.sync.cronSchedule;

    logger.info(`Starting shipment sync job with schedule: ${schedule}`);

    cron.schedule(schedule, async () => {
        logger.info('Starting periodic shipment sync...');
        const db = getDatabase();
        const syncId = uuidv4();
        const startedAt = new Date().toISOString();
        let synced = 0;
        let failed = 0;
        let errorMessages: string[] = [];

        try {
            const activeShipments = await shipmentService.getActiveShipments();
            logger.info(`Found ${activeShipments.length} active shipments to sync`);

            for (const shipment of activeShipments) {
                if (!shipment.shipment_number) continue;

                try {
                    const oldEta = shipment.eta;
                    const oldStatus = shipment.status;

                    await shipmentService.trackShipment(shipment.shipment_number, shipment.sealine || undefined);
                    synced++;

                    // Check for changes to create alerts
                    const updated = await shipmentService.getShipmentDetail(shipment.id);
                    if (updated) {
                        // ETA change detection
                        if (oldEta && updated.eta && oldEta !== updated.eta) {
                            alertRepository.create({
                                shipment_id: shipment.id,
                                shipment_number: shipment.shipment_number,
                                alert_type: 'ETA_CHANGED',
                                alert_info: `ETA changed from ${oldEta} to ${updated.eta}`,
                                severity: 'HIGH',
                            });
                        }

                        // Status change detection
                        if (oldStatus !== updated.status) {
                            alertRepository.create({
                                shipment_id: shipment.id,
                                shipment_number: shipment.shipment_number,
                                alert_type: 'STATUS_CHANGED',
                                alert_info: `Status changed from ${oldStatus} to ${updated.status}`,
                                severity: 'MEDIUM',
                            });
                        }
                    }
                } catch (err: any) {
                    failed++;
                    errorMessages.push(`${shipment.shipment_number}: ${err.message}`);
                    logger.error(`Failed to sync shipment ${shipment.shipment_number}:`, err);
                }
            }
        } catch (err: any) {
            logger.error('Sync job failed:', err);
            errorMessages.push(err.message);
        }

        const completedAt = new Date().toISOString();
        const durationMs = new Date(completedAt).getTime() - new Date(startedAt).getTime();

        // Log sync result
        db.run(
            `INSERT INTO api_sync_logs (id, sync_type, status, shipments_synced, shipments_failed, error_message, started_at, completed_at, duration_ms, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [syncId, 'PERIODIC', failed > 0 ? 'PARTIAL' : 'SUCCESS', synced, failed,
                errorMessages.join('; ') || null, startedAt, completedAt, durationMs, completedAt]
        );
        saveDatabase();

        logger.info(`Sync completed: ${synced} synced, ${failed} failed, ${durationMs}ms`);
    });
}
