import { getDatabase, saveDatabase } from '../../config/database';
import { v4 as uuidv4 } from 'uuid';
import { logger } from '../../utils/logger';
import { AlertRepository } from '../../modules/alert/alert.repository';
import { ShipmentService } from '../../modules/shipment/shipment.service';
import { CommunicationService } from '../../modules/communication/communication.service';
import { AssignmentRepository } from '../../modules/shipment/assignment.repository';

/**
 * Processes incoming webhook events from Sinay/Svix.
 */
export class WebhookHandler {
    private alertRepository: AlertRepository;
    private shipmentService: ShipmentService;
    private communicationService: CommunicationService;
    private assignmentRepository: AssignmentRepository;

    constructor() {
        this.alertRepository = new AlertRepository();
        this.shipmentService = new ShipmentService();
        this.communicationService = new CommunicationService();
        this.assignmentRepository = new AssignmentRepository();
    }

    async processEvent(eventType: string, payload: any): Promise<void> {
        const db = getDatabase();
        const now = new Date().toISOString();

        // Log the webhook
        db.run(
            `INSERT INTO webhook_logs (id, event_type, payload, source, processed, received_at, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [uuidv4(), eventType, JSON.stringify(payload), 'sinay', 0, now, now]
        );

        // Process based on event type
        switch (eventType) {
            case 'container.arrival.at.first.pol':
            case 'container.arrival.at.final.pod':
            case 'vessel.arrival.at.final.pod':
                await this.handleArrivalEvent(eventType, payload);
                break;

            case 'container.departure.from.first.pol':
            case 'container.departure.from.final.pod':
            case 'vessel.departure.from.first.pol':
                await this.handleDepartureEvent(eventType, payload);
                break;

            case 'container.loaded.at.first.pol':
            case 'container.discharge.at.final.pod':
                await this.handleEquipmentEvent(eventType, payload);
                break;

            default:
                logger.info(`Unhandled webhook event type: ${eventType}`);
        }

        // Mark webhook as processed
        db.run(
            `UPDATE webhook_logs SET processed = 1, processed_at = ? WHERE event_type = ? AND received_at = ?`,
            [now, eventType, now]
        );
        saveDatabase();

        // Automatically trigger a live database sync for this shipment
        const shipmentNumber = payload?.data?.shipmentNumber || payload?.shipmentNumber;
        if (shipmentNumber) {
            try {
                logger.info(`Webhook triggering real-time sync for shipment ${shipmentNumber}`);
                await this.shipmentService.trackShipment(shipmentNumber);
            } catch (err: any) {
                logger.error(`Webhook real-time sync failed for shipment ${shipmentNumber}:`, err);
            }
        }
    }

    private async handleArrivalEvent(eventType: string, payload: any): Promise<void> {
        const shipmentNumber = payload?.data?.shipmentNumber || payload?.shipmentNumber;
        if (!shipmentNumber) return;

        // Create alert for arrival
        this.alertRepository.create({
            shipment_number: shipmentNumber,
            alert_type: 'ARRIVAL',
            alert_info: `${eventType}: Vessel/container arrival detected`,
            severity: 'MEDIUM',
            status: 'OPEN',
        });

        logger.info(`Arrival alert created for shipment ${shipmentNumber}`);

        await this.notifyAssignedCustomers(shipmentNumber, 'Arrival Update', `${eventType}: Vessel or container arrival has been detected for your shipment.`);
    }

    private async handleDepartureEvent(eventType: string, payload: any): Promise<void> {
        const shipmentNumber = payload?.data?.shipmentNumber || payload?.shipmentNumber;
        if (!shipmentNumber) return;

        this.alertRepository.create({
            shipment_number: shipmentNumber,
            alert_type: 'DEPARTURE',
            alert_info: `${eventType}: Vessel/container departure detected`,
            severity: 'LOW',
            status: 'OPEN',
        });

        logger.info(`Departure alert created for shipment ${shipmentNumber}`);
        await this.notifyAssignedCustomers(shipmentNumber, 'Departure Update', `${eventType}: Vessel or container departure has been detected for your shipment.`);
    }

    private async handleEquipmentEvent(eventType: string, payload: any): Promise<void> {
        const shipmentNumber = payload?.data?.shipmentNumber || payload?.shipmentNumber;
        if (!shipmentNumber) return;

        this.alertRepository.create({
            shipment_number: shipmentNumber,
            alert_type: 'EQUIPMENT',
            alert_info: `${eventType}: Container equipment event detected`,
            severity: 'LOW',
            status: 'OPEN',
        });

        logger.info(`Equipment alert created for shipment ${shipmentNumber}`);
    }

    private async notifyAssignedCustomers(shipmentNumber: string, subject: string, message: string): Promise<void> {
        // Find shipments matching the number (get shipment DB id)
        const db = getDatabase();
        const shipResult = db.exec(`SELECT id FROM shipments WHERE shipment_number = '${shipmentNumber.replace(/'/g, "''")}'`);
        if (shipResult.length === 0 || shipResult[0].values.length === 0) return;
        const shipmentId = shipResult[0].values[0][0] as string;

        // Find assigned customers
        const assignResult = db.exec(`SELECT customer_name, customer_email, tracking_id FROM shipment_assignments WHERE shipment_id = '${shipmentId}'`);
        if (assignResult.length === 0 || assignResult[0].values.length === 0) return;

        // Alert all assigned customers
        for (const row of assignResult[0].values) {
            const [customerName, customerEmail, trackingId] = row as string[];
            if (customerEmail) {
                try {
                    await this.communicationService.sendEmail({
                        template_id: 'auto-webhook',
                        recipient_email: customerEmail,
                        recipient_name: customerName,
                        subject: `Webhook Alert: ${subject} (${trackingId})`,
                        body: `Hello ${customerName},\n\nWe have a real-time update regarding your shipment (${trackingId}).\n\n${message}\n\nPlease check your Customer Portal for more details.`,
                        shipment_id: shipmentId
                    });
                    logger.info(`Webhook alert email dispatched to ${customerEmail}`);
                } catch (err: any) {
                    logger.error(`Failed to send email alert to ${customerEmail}:`, err);
                }
            }
        }
    }

    async getLogs(page: number = 1, limit: number = 20): Promise<{ data: any[]; total: number }> {
        const db = getDatabase();
        const offset = (page - 1) * limit;

        const countRes = db.exec('SELECT COUNT(*) as total FROM webhook_logs');
        const total = countRes.length > 0 ? (countRes[0].values[0][0] as number) : 0;

        const res = db.exec(`SELECT * FROM webhook_logs ORDER BY received_at DESC LIMIT ${limit} OFFSET ${offset}`);

        return {
            data: this.mapRows(res),
            total
        };
    }

    private mapRows(result: any[]): any[] {
        if (!result || result.length === 0) return [];
        const { columns, values } = result[0];
        return values.map((row: any[]) => {
            const obj: any = {};
            columns.forEach((col: string, i: number) => { obj[col] = row[i]; });
            return obj;
        });
    }
}
