import { getDatabase, saveDatabase } from '../../config/database';
import { v4 as uuidv4 } from 'uuid';
import { InquiryRow, CreateInquiryInput, AdminRespondInput } from './inquiry.types';

export class InquiryRepository {
    private generateTrackingId(): string {
        const prefix = 'TRK';
        const randomString = Math.random().toString(36).substring(2, 8).toUpperCase();
        return `${prefix}-${randomString}`;
    }

    findAll(status?: string, page: number = 1, limit: number = 20): { data: InquiryRow[]; total: number } {
        const db = getDatabase();
        const offset = (page - 1) * limit;
        const where = status ? `WHERE status = '${status}'` : '';

        const countResult = db.exec(`SELECT COUNT(*) FROM customer_inquiries ${where}`);
        const total = countResult.length > 0 ? (countResult[0].values[0][0] as number) : 0;

        const result = db.exec(`SELECT * FROM customer_inquiries ${where} ORDER BY created_at DESC LIMIT ${limit} OFFSET ${offset}`);
        return { data: this.mapRows<InquiryRow>(result), total };
    }

    findById(id: string): InquiryRow | null {
        const db = getDatabase();
        const result = db.exec(`SELECT * FROM customer_inquiries WHERE id = '${id.replace(/'/g, "''")}'`);
        const rows = this.mapRows<InquiryRow>(result);
        return rows[0] || null;
    }

    findByTrackingId(trackingId: string): InquiryRow | null {
        const db = getDatabase();
        const result = db.exec(`SELECT * FROM customer_inquiries WHERE tracking_id = '${trackingId.replace(/'/g, "''")}'`);
        const rows = this.mapRows<InquiryRow>(result);
        return rows[0] || null;
    }

    create(input: CreateInquiryInput): InquiryRow {
        const db = getDatabase();
        const id = uuidv4();
        const trackingId = this.generateTrackingId();
        const now = new Date().toISOString();

        db.run(
            `INSERT INTO customer_inquiries (id, tracking_id, shipment_id, customer_name, customer_email, message, status, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                id,
                trackingId,
                input.shipment_id || null,
                input.customer_name,
                input.customer_email || null,
                input.message || null,
                'NEW',
                now,
                now
            ]
        );
        saveDatabase();
        return this.findById(id)!;
    }

    update(id: string, updates: AdminRespondInput): InquiryRow | null {
        const db = getDatabase();
        const existing = this.findById(id);
        if (!existing) return null;

        const now = new Date().toISOString();
        db.run(
            `UPDATE customer_inquiries SET admin_response = ?, status = ?, updated_at = ? WHERE id = ?`,
            [updates.admin_response, updates.status, now, id]
        );
        saveDatabase();
        return this.findById(id);
    }

    linkToShipment(id: string, shipmentId: string): InquiryRow | null {
        const db = getDatabase();
        const existing = this.findById(id);
        if (!existing) return null;

        const now = new Date().toISOString();
        db.run(
            `UPDATE customer_inquiries SET shipment_id = ?, updated_at = ? WHERE id = ?`,
            [shipmentId, now, id]
        );
        saveDatabase();
        return this.findById(id);
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
