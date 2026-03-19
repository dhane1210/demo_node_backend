import { getDatabase } from '../../config/database';
import { generatePdf, PdfSection } from '../../utils/pdf-generator';
import { logger } from '../../utils/logger';

export class ReportService {
    /**
     * Generate daily summary PDF for a customer (or all customers).
     */
    async generateDailySummary(customerId?: string, date?: string): Promise<PDFKit.PDFDocument> {
        const db = getDatabase();
        const targetDate = date || new Date().toISOString().split('T')[0];

        let query = `
      SELECT s.*, c.number as container_number
      FROM shipments s
      LEFT JOIN containers c ON c.shipment_id = s.id
      WHERE s.status NOT IN ('COMPLETED')
    `;
        if (customerId) {
            query += ` AND s.customer_id = '${customerId.replace(/'/g, "''")}'`;
        }
        query += ' ORDER BY s.customer_name, s.eta ASC';

        const result = db.exec(query);
        const shipments = this.mapRows<any>(result);

        // Get alerts summary
        const alertsResult = db.exec(
            `SELECT * FROM alerts WHERE status = 'OPEN' ORDER BY severity DESC LIMIT 20`
        );
        const alerts = this.mapRows<any>(alertsResult);

        // Build PDF sections
        const sections: PdfSection[] = [];

        // Shipment table
        sections.push({
            title: 'Active Shipments',
            table: {
                headers: ['Shipment #', 'Customer', 'Vessel', 'Status', 'ETA', 'Container'],
                rows: shipments.map((s: any) => [
                    s.shipment_number || '-',
                    s.customer_name || '-',
                    s.vessel_name || '-',
                    s.status || '-',
                    s.eta ? s.eta.split('T')[0] : '-',
                    s.container_number || '-',
                ]),
            },
        });

        // Alerts summary
        if (alerts.length > 0) {
            sections.push({
                title: 'Open Alerts',
                table: {
                    headers: ['Shipment', 'Type', 'Severity', 'Detected'],
                    rows: alerts.map((a: any) => [
                        a.shipment_number || '-',
                        a.alert_type || '-',
                        a.severity || '-',
                        a.detection_date ? a.detection_date.split('T')[0] : '-',
                    ]),
                },
            });
        }

        const customerName = customerId
            ? (shipments[0]?.customer_name || 'Customer')
            : 'All Customers';

        const doc = generatePdf(
            'Daily Shipment Summary',
            `${customerName} — ${targetDate}`,
            sections
        );

        logger.info(`Daily summary PDF generated for ${customerName}`);
        return doc;
    }

    /**
     * Generate a detailed report for a single shipment.
     */
    async generateShipmentReport(shipmentId: string): Promise<PDFKit.PDFDocument | null> {
        const db = getDatabase();

        const shipmentResult = db.exec(
            `SELECT * FROM shipments WHERE id = '${shipmentId.replace(/'/g, "''")}'`
        );
        const shipments = this.mapRows<any>(shipmentResult);
        if (!shipments.length) return null;

        const shipment = shipments[0];

        const eventsResult = db.exec(
            `SELECT * FROM container_events WHERE shipment_id = '${shipmentId.replace(/'/g, "''")}' ORDER BY date ASC`
        );
        const events = this.mapRows<any>(eventsResult);

        const sections: PdfSection[] = [
            {
                title: 'Booking Details',
                content: [
                    `Shipment Number: ${shipment.shipment_number || '-'}`,
                    `BL Number: ${shipment.bl_number || '-'}`,
                    `Customer: ${shipment.customer_name || '-'}`,
                    `Shipper: ${shipment.shipper || '-'}`,
                    `Consignee: ${shipment.consignee || '-'}`,
                    `Status: ${shipment.status || '-'}`,
                    `Vessel: ${shipment.vessel_name || '-'}`,
                    `Route: ${shipment.pol_name || '-'} → ${shipment.pod_name || '-'}`,
                    `ETD: ${shipment.etd || '-'}`,
                    `ETA: ${shipment.eta || '-'}`,
                    `Weight: ${shipment.gross_weight || '-'} kg`,
                    `CBM: ${shipment.cbm || '-'}`,
                ].join('\n'),
            },
        ];

        if (events.length > 0) {
            sections.push({
                title: 'Tracking Timeline',
                table: {
                    headers: ['Date', 'Event', 'Location', 'Type'],
                    rows: events.map((e: any) => [
                        e.date ? e.date.split('T')[0] : '-',
                        e.description || '-',
                        e.location_name || '-',
                        e.route_type || '-',
                    ]),
                },
            });
        }

        const doc = generatePdf(
            `Shipment Report: ${shipment.shipment_number || shipmentId}`,
            `Generated for ${shipment.customer_name || 'N/A'}`,
            sections
        );

        return doc;
    }

    private mapRows<T>(result: any[]): T[] {
        if (!result || result.length === 0) return [];
        const { columns, values } = result[0];
        return values.map((row: any[]) => {
            const obj: any = {};
            columns.forEach((col: string, i: number) => { obj[col] = row[i]; });
            return obj as T;
        });
    }
}
