import { getDatabase, saveDatabase } from '../../config/database';
import { v4 as uuidv4 } from 'uuid';
import { EmailTemplateRow, EmailLogRow } from './communication.types';

export class CommunicationRepository {
    // ─── Templates ────────────────────────────────────────

    findAllTemplates(): EmailTemplateRow[] {
        const db = getDatabase();
        const result = db.exec('SELECT * FROM email_templates WHERE is_active = 1 ORDER BY type');
        return this.mapRows<EmailTemplateRow>(result);
    }

    findTemplateById(id: string): EmailTemplateRow | null {
        const db = getDatabase();
        const result = db.exec(`SELECT * FROM email_templates WHERE id = '${id.replace(/'/g, "''")}'`);
        const rows = this.mapRows<EmailTemplateRow>(result);
        return rows[0] || null;
    }

    // ─── Email Logs ───────────────────────────────────────

    findLogsByShipmentId(shipmentId: string): EmailLogRow[] {
        const db = getDatabase();
        const result = db.exec(
            `SELECT * FROM email_logs WHERE shipment_id = '${shipmentId.replace(/'/g, "''")}' ORDER BY sent_at DESC`
        );
        return this.mapRows<EmailLogRow>(result);
    }

    findAllLogs(page: number = 1, limit: number = 20): { data: EmailLogRow[]; total: number } {
        const db = getDatabase();
        const offset = (page - 1) * limit;
        const countResult = db.exec('SELECT COUNT(*) FROM email_logs');
        const total = countResult.length > 0 ? (countResult[0].values[0][0] as number) : 0;
        const result = db.exec(`SELECT * FROM email_logs ORDER BY sent_at DESC LIMIT ${limit} OFFSET ${offset}`);
        return { data: this.mapRows<EmailLogRow>(result), total };
    }

    createEmailLog(log: Partial<EmailLogRow>): EmailLogRow {
        const db = getDatabase();
        const id = uuidv4();
        const now = new Date().toISOString();
        db.run(
            `INSERT INTO email_logs (id, shipment_id, template_id, recipient_email, recipient_name, subject, body, status, staff_member, sent_at, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [id, log.shipment_id ?? null, log.template_id ?? null, log.recipient_email ?? null,
                log.recipient_name ?? null, log.subject ?? null, log.body ?? null, log.status || 'SENT',
                log.staff_member ?? null, now, now]
        );
        saveDatabase();
        const result = db.exec(`SELECT * FROM email_logs WHERE id = '${id}'`);
        return this.mapRows<EmailLogRow>(result)[0];
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
