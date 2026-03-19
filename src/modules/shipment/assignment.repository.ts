import { getDatabase, saveDatabase } from '../../config/database';
import { v4 as uuidv4 } from 'uuid';
import { ShipmentAssignment, CreateAssignmentInput } from './assignment.types';

export class AssignmentRepository {
    private mapRows<T>(result: any[]): T[] {
        if (!result || result.length === 0) return [];
        const { columns, values } = result[0];
        return values.map((row: any[]) => {
            const obj: any = {};
            columns.forEach((col: string, i: number) => {
                obj[col] = row[i];
            });
            return obj as T;
        });
    }

    findAll(page: number = 1, limit: number = 20, customerId?: string, shipmentId?: string): { data: ShipmentAssignment[]; total: number } {
        let dataConditions = [];
        if (customerId) dataConditions.push(`a.customer_id = '${customerId.replace(/'/g, "''")}'`);
        if (shipmentId) dataConditions.push(`a.shipment_id = '${shipmentId.replace(/'/g, "''")}'`);
        const dataWhereClause = dataConditions.length > 0 ? `WHERE ${dataConditions.join(' AND ')}` : '';

        let totalConditions = [];
        if (customerId) totalConditions.push(`customer_id = '${customerId.replace(/'/g, "''")}'`);
        if (shipmentId) totalConditions.push(`shipment_id = '${shipmentId.replace(/'/g, "''")}'`);
        const totalWhereClause = totalConditions.length > 0 ? `WHERE ${totalConditions.join(' AND ')}` : '';

        const db = getDatabase();
        const offset = (page - 1) * limit;

        let totalQuery = `SELECT COUNT(*) as total FROM shipment_assignments ${totalWhereClause}`;
        let dataQuery = `
            SELECT a.*, s.shipment_number, s.vessel_name
            FROM shipment_assignments a
            JOIN shipments s ON a.shipment_id = s.id
            ${dataWhereClause}
        `;

        dataQuery += ` ORDER BY a.created_at DESC LIMIT ${limit} OFFSET ${offset}`;

        const countResult = db.exec(totalQuery);
        const total = countResult.length > 0 ? (countResult[0].values[0][0] as number) : 0;

        const result = db.exec(dataQuery);

        const data = this.mapRows<ShipmentAssignment & { shipment_number: string; vessel_name: string }>(result);
        return { data, total };
    }

    findById(id: string): ShipmentAssignment | null {
        const db = getDatabase();
        const result = db.exec(`SELECT * FROM shipment_assignments WHERE id = '${id.replace(/'/g, "''")}'`);
        const rows = this.mapRows<ShipmentAssignment>(result);
        return rows[0] || null;
    }

    findByTrackingId(trackingId: string): (ShipmentAssignment & { shipment_number: string }) | null {
        const db = getDatabase();
        const result = db.exec(`
            SELECT a.*, s.shipment_number
            FROM shipment_assignments a
            JOIN shipments s ON a.shipment_id = s.id
            WHERE a.tracking_id = '${trackingId.replace(/'/g, "''")}'
        `);
        const rows = this.mapRows<ShipmentAssignment & { shipment_number: string }>(result);
        return rows[0] || null;
    }

    create(assignment: Partial<ShipmentAssignment>): ShipmentAssignment {
        const db = getDatabase();
        const id = assignment.id || uuidv4();
        const now = new Date().toISOString();

        db.run(`
            INSERT INTO shipment_assignments (
                id, shipment_id, customer_id, tracking_id, customer_name, customer_email, assigned_by, notes, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
            id,
            assignment.shipment_id ?? null,
            assignment.customer_id ?? null,
            assignment.tracking_id ?? null,
            assignment.customer_name ?? null,
            assignment.customer_email ?? null,
            assignment.assigned_by || 'Admin',
            assignment.notes || null,
            now,
            now
        ]);

        saveDatabase();
        return this.findById(id)!;
    }

    delete(id: string): boolean {
        const db = getDatabase();
        db.run(`DELETE FROM shipment_assignments WHERE id = '${id.replace(/'/g, "''")}'`);
        saveDatabase();
        return true;
    }
}
