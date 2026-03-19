import { getDatabase, saveDatabase } from '../../config/database';
import { v4 as uuidv4 } from 'uuid';
import { JobRow, PricingRow } from './pricing.types';

export class PricingRepository {
    // ─── Jobs ─────────────────────────────────────────────

    findAllJobs(status?: string, page: number = 1, limit: number = 20): { data: JobRow[]; total: number } {
        const db = getDatabase();
        const offset = (page - 1) * limit;
        const where = status ? `WHERE status = '${status}'` : '';

        const countResult = db.exec(`SELECT COUNT(*) FROM jobs ${where}`);
        const total = countResult.length > 0 ? (countResult[0].values[0][0] as number) : 0;

        const result = db.exec(`SELECT * FROM jobs ${where} ORDER BY created_at DESC LIMIT ${limit} OFFSET ${offset}`);
        return { data: this.mapRows<JobRow>(result), total };
    }

    findJobById(id: string): JobRow | null {
        const db = getDatabase();
        const result = db.exec(`SELECT * FROM jobs WHERE id = '${id.replace(/'/g, "''")}'`);
        const rows = this.mapRows<JobRow>(result);
        return rows[0] || null;
    }

    createJob(job: Partial<JobRow>): JobRow {
        const db = getDatabase();
        const id = uuidv4();
        const now = new Date().toISOString();
        db.run(
            `INSERT INTO jobs (id, customer_id, shipper, consignee, commodity, package_contains, package_type,
       date_needed, weight, cbm, incoterm, pickup, delivery, additional_notes, status, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [id, job.customer_id || null, job.shipper || null, job.consignee || null,
                job.commodity || null, job.package_contains || null, job.package_type || null,
                job.date_needed || null, job.weight || null, job.cbm || null,
                job.incoterm || null, job.pickup || null, job.delivery || null,
                job.additional_notes || null, job.status || 'PENDING', now, now]
        );
        saveDatabase();
        return this.findJobById(id)!;
    }

    updateJob(id: string, updates: Partial<JobRow>): JobRow | null {
        const db = getDatabase();
        const existing = this.findJobById(id);
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

        db.run(`UPDATE jobs SET ${setClauses.join(', ')} WHERE id = ?`, values);
        saveDatabase();
        return this.findJobById(id);
    }

    // ─── Pricing ──────────────────────────────────────────

    findPricingByJobId(jobId: string): PricingRow | null {
        const db = getDatabase();
        const result = db.exec(`SELECT * FROM pricing WHERE job_id = '${jobId.replace(/'/g, "''")}'`);
        const rows = this.mapRows<PricingRow>(result);
        return rows[0] || null;
    }

    upsertPricing(pricing: Partial<PricingRow> & { job_id: string }): PricingRow {
        const db = getDatabase();
        const existing = this.findPricingByJobId(pricing.job_id);
        const now = new Date().toISOString();

        if (existing) {
            const setClauses: string[] = [];
            const values: any[] = [];
            for (const [key, value] of Object.entries(pricing)) {
                if (key === 'id' || key === 'created_at' || key === 'job_id') continue;
                setClauses.push(`${key} = ?`);
                values.push(value ?? null);
            }
            setClauses.push('updated_at = ?');
            values.push(now);
            values.push(existing.id);

            db.run(`UPDATE pricing SET ${setClauses.join(', ')} WHERE id = ?`, values);
            saveDatabase();
            return this.findPricingByJobId(pricing.job_id)!;
        } else {
            const id = uuidv4();
            db.run(
                `INSERT INTO pricing (id, job_id, agent_rate, clearance_charges, delivery_order, vat, markup_percent, total_cost, selling_price, profit_value, profit_margin_percent, currency, notes, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [id, pricing.job_id, pricing.agent_rate || 0, pricing.clearance_charges || 0,
                    pricing.delivery_order || 0, pricing.vat || 0, pricing.markup_percent || 0,
                    pricing.total_cost || 0, pricing.selling_price || 0, pricing.profit_value || 0,
                    pricing.profit_margin_percent || 0, pricing.currency || 'USD',
                    pricing.notes || null, now, now]
            );
            saveDatabase();
            return this.findPricingByJobId(pricing.job_id)!;
        }
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
