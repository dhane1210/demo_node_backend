import { getDatabase, saveDatabase } from '../../config/database';
import { v4 as uuidv4 } from 'uuid';
import { AlertRow } from './alert.types';

export class AlertRepository {
    findAll(status?: string, severity?: string, page: number = 1, limit: number = 20): { data: AlertRow[]; total: number } {
        const db = getDatabase();
        const conditions: string[] = ['1=1'];
        const offset = (page - 1) * limit;

        if (status) conditions.push(`status = '${status}'`);
        if (severity) conditions.push(`severity = '${severity}'`);

        const where = conditions.join(' AND ');
        const countResult = db.exec(`SELECT COUNT(*) FROM alerts WHERE ${where}`);
        const total = countResult.length > 0 ? (countResult[0].values[0][0] as number) : 0;

        const result = db.exec(
            `SELECT * FROM alerts WHERE ${where} ORDER BY detection_date DESC LIMIT ${limit} OFFSET ${offset}`
        );
        return { data: this.mapRows<AlertRow>(result), total };
    }

    findById(id: string): AlertRow | null {
        const db = getDatabase();
        const result = db.exec(`SELECT * FROM alerts WHERE id = '${id.replace(/'/g, "''")}'`);
        const rows = this.mapRows<AlertRow>(result);
        return rows[0] || null;
    }

    create(alert: Partial<AlertRow>): AlertRow {
        const db = getDatabase();
        const id = uuidv4();
        const now = new Date().toISOString();
        db.run(
            `INSERT INTO alerts (id, shipment_id, shipment_number, alert_type, alert_info, severity, status, detection_date, action_taken, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [id, alert.shipment_id || null, alert.shipment_number || null, alert.alert_type || 'INFO',
                alert.alert_info || null, alert.severity || 'MEDIUM', alert.status || 'OPEN',
                alert.detection_date || now, alert.action_taken || null, now, now]
        );
        saveDatabase();
        return this.findById(id)!;
    }

    update(id: string, updates: Partial<AlertRow>): AlertRow | null {
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

        db.run(`UPDATE alerts SET ${setClauses.join(', ')} WHERE id = ?`, values);
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
