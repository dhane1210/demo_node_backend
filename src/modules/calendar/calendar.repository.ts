import { getDatabase, saveDatabase } from '../../config/database';
import { v4 as uuidv4 } from 'uuid';
import { CalendarEventRow } from './calendar.types';

export class CalendarRepository {
    findAll(startDate?: string, endDate?: string, eventType?: string): CalendarEventRow[] {
        const db = getDatabase();
        const conditions: string[] = ['1=1'];

        if (startDate) conditions.push(`event_date >= '${startDate}'`);
        if (endDate) conditions.push(`event_date <= '${endDate}'`);
        if (eventType) conditions.push(`event_type = '${eventType}'`);

        const result = db.exec(
            `SELECT * FROM calendar_events WHERE ${conditions.join(' AND ')} ORDER BY event_date ASC`
        );
        return this.mapRows<CalendarEventRow>(result);
    }

    findById(id: string): CalendarEventRow | null {
        const db = getDatabase();
        const result = db.exec(`SELECT * FROM calendar_events WHERE id = '${id.replace(/'/g, "''")}'`);
        const rows = this.mapRows<CalendarEventRow>(result);
        return rows[0] || null;
    }

    create(event: Partial<CalendarEventRow>): CalendarEventRow {
        const db = getDatabase();
        const id = uuidv4();
        const now = new Date().toISOString();
        db.run(
            `INSERT INTO calendar_events (id, shipment_id, event_type, title, description, event_date, all_day, color, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [id, event.shipment_id ?? null, event.event_type ?? null, event.title ?? null, event.description ?? null,
                event.event_date ?? null, event.all_day ?? 1, event.color ?? null, now, now]
        );
        saveDatabase();
        return this.findById(id)!;
    }

    update(id: string, updates: Partial<CalendarEventRow>): CalendarEventRow | null {
        const db = getDatabase();
        const existing = this.findById(id);
        if (!existing) return null;

        const setClauses: string[] = [];
        const values: any[] = [];
        for (const [key, value] of Object.entries(updates)) {
            if (key === 'id' || key === 'created_at') continue;
            setClauses.push(`${key} = ?`);
            values.push(value ?? null);
        }
        setClauses.push('updated_at = ?');
        values.push(new Date().toISOString());
        values.push(id);

        db.run(`UPDATE calendar_events SET ${setClauses.join(', ')} WHERE id = ?`, values);
        saveDatabase();
        return this.findById(id);
    }

    delete(id: string): boolean {
        const db = getDatabase();
        db.run(`DELETE FROM calendar_events WHERE id = '${id.replace(/'/g, "''")}'`);
        saveDatabase();
        return true;
    }

    /**
     * Auto-generate calendar events from shipment data.
     */
    syncFromShipments(): number {
        const db = getDatabase();
        // Clear auto-generated events
        db.run(`DELETE FROM calendar_events WHERE shipment_id IS NOT NULL`);

        const shipments = db.exec(
            `SELECT id, shipment_number, customer_name, etd, eta, cutoff_date, delivery_deadline, status FROM shipments
       WHERE status NOT IN ('COMPLETED') AND (etd IS NOT NULL OR eta IS NOT NULL OR cutoff_date IS NOT NULL OR delivery_deadline IS NOT NULL)`
        );

        if (!shipments.length) return 0;

        let count = 0;
        const rows = this.mapRows<any>(shipments);

        for (const s of rows) {
            if (s.etd) {
                this.create({
                    shipment_id: s.id,
                    event_type: 'ETD',
                    title: `ETD: ${s.shipment_number || 'Shipment'} - ${s.customer_name || 'N/A'}`,
                    event_date: s.etd,
                    color: '#3b82f6',
                });
                count++;
            }
            if (s.eta) {
                this.create({
                    shipment_id: s.id,
                    event_type: 'ETA',
                    title: `ETA: ${s.shipment_number || 'Shipment'} - ${s.customer_name || 'N/A'}`,
                    event_date: s.eta,
                    color: '#10b981',
                });
                count++;
            }
            if (s.cutoff_date) {
                this.create({
                    shipment_id: s.id,
                    event_type: 'CUTOFF',
                    title: `Cutoff: ${s.shipment_number || 'Shipment'} - ${s.customer_name || 'N/A'}`,
                    event_date: s.cutoff_date,
                    color: '#f59e0b',
                });
                count++;
            }
            if (s.delivery_deadline) {
                this.create({
                    shipment_id: s.id,
                    event_type: 'DELIVERY_DEADLINE',
                    title: `Delivery: ${s.shipment_number || 'Shipment'} - ${s.customer_name || 'N/A'}`,
                    event_date: s.delivery_deadline,
                    color: '#ef4444',
                });
                count++;
            }
        }

        return count;
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
