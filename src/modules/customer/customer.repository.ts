import { getDatabase, saveDatabase } from '../../config/database';
import { CustomerRow, CreateCustomerInput, UpdateCustomerInput } from './customer.types';
import { v4 as uuidv4 } from 'uuid';

export class CustomerRepository {
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

    findAll(page: number = 1, limit: number = 20): { data: CustomerRow[], total: number } {
        const db = getDatabase();
        const offset = (page - 1) * limit;

        const countResult = db.exec('SELECT COUNT(*) as total FROM customers');
        const total = countResult.length > 0 ? (countResult[0].values[0][0] as number) : 0;

        const result = db.exec(`
            SELECT * FROM customers 
            ORDER BY created_at DESC 
            LIMIT ${limit} OFFSET ${offset}
        `);
        const data = this.mapRows<CustomerRow>(result);

        return { data, total };
    }

    findById(id: string): CustomerRow | undefined {
        const db = getDatabase();
        const result = db.exec(`SELECT * FROM customers WHERE id = '${id.replace(/'/g, "''")}'`);
        const rows = this.mapRows<CustomerRow>(result);
        return rows[0];
    }

    create(input: CreateCustomerInput): CustomerRow {
        const db = getDatabase();
        const id = uuidv4();
        const now = new Date().toISOString();

        db.run(`
            INSERT INTO customers (
                id, name, email, company, phone, address, contact_person, notes, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
            id,
            input.name,
            input.email || null,
            input.company || null,
            input.phone || null,
            input.address || null,
            input.contact_person || null,
            input.notes || null,
            now,
            now
        ]);

        saveDatabase();
        return this.findById(id)!;
    }

    update(id: string, input: UpdateCustomerInput): CustomerRow | undefined {
        const current = this.findById(id);
        if (!current) return undefined;

        const updates: string[] = [];
        const params: any[] = [];

        // Ensure predictable order
        const keys = Object.keys(input) as (keyof UpdateCustomerInput)[];
        if (keys.length === 0) return current;

        for (const key of keys) {
            const value = input[key];
            if (value !== undefined) {
                updates.push(`${key} = ?`);
                params.push(value);
            }
        }

        updates.push(`updated_at = ?`);
        params.push(new Date().toISOString());

        params.push(id);

        const db = getDatabase();
        db.run(`
            UPDATE customers 
            SET ${updates.join(', ')}
            WHERE id = ?
        `, params);

        saveDatabase();
        return this.findById(id);
    }

    delete(id: string): boolean {
        const db = getDatabase();
        try {
            db.run(`DELETE FROM customers WHERE id = '${id.replace(/'/g, "''")}'`);
            saveDatabase();
            return true;
        } catch (e) {
            return false;
        }
    }
}
