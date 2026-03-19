import { getDatabase, saveDatabase } from '../../config/database';
import { v4 as uuidv4 } from 'uuid';
import { ShipmentDocumentRow } from './document.types';

export class DocumentRepository {
    findByShipmentId(shipmentId: string): ShipmentDocumentRow[] {
        const db = getDatabase();
        const result = db.exec(
            `SELECT * FROM shipment_documents WHERE shipment_id = '${shipmentId.replace(/'/g, "''")}' ORDER BY created_at DESC`
        );
        return this.mapRows<ShipmentDocumentRow>(result);
    }

    create(document: Partial<ShipmentDocumentRow>): ShipmentDocumentRow {
        const db = getDatabase();
        const id = uuidv4();
        const now = new Date().toISOString();
        db.run(
            `INSERT INTO shipment_documents (id, shipment_id, name, type, url, size, uploaded_by, created_at, updated_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                id,
                document.shipment_id || '',
                document.name || '',
                document.type || null,
                document.url || '',
                document.size || null,
                document.uploaded_by || null,
                now,
                now
            ]
        );
        saveDatabase();
        return this.findById(id)!;
    }

    findById(id: string): ShipmentDocumentRow | null {
        const db = getDatabase();
        const result = db.exec(`SELECT * FROM shipment_documents WHERE id = '${id.replace(/'/g, "''")}'`);
        const rows = this.mapRows<ShipmentDocumentRow>(result);
        return rows[0] || null;
    }

    delete(id: string): boolean {
        const db = getDatabase();
        db.run(`DELETE FROM shipment_documents WHERE id = '${id.replace(/'/g, "''")}'`);
        saveDatabase();
        return true;
    }

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
}
