import { getDatabase, saveDatabase } from '../../config/database';
import { v4 as uuidv4 } from 'uuid';
import { ShipmentRow, ContainerRow, ContainerEventRow, RouteSegmentRow, ShipmentSearchParams } from './shipment.types';

/**
 * Shipment Repository — handles all raw SQL operations for shipments.
 */
export class ShipmentRepository {
    /**
     * Get all shipments with pagination.
     */
    findAll(page: number = 1, limit: number = 20): { data: ShipmentRow[]; total: number } {
        const db = getDatabase();
        const offset = (page - 1) * limit;

        const countResult = db.exec('SELECT COUNT(*) as total FROM shipments');
        const total = countResult.length > 0 ? (countResult[0].values[0][0] as number) : 0;

        const result = db.exec(
            `SELECT s.*, c.number as container_number
       FROM shipments s
       LEFT JOIN containers c ON c.shipment_id = s.id
       ORDER BY s.updated_at DESC
       LIMIT ${limit} OFFSET ${offset}`
        );

        const data = this.mapRows<ShipmentRow & { container_number: string }>(result);
        return { data, total };
    }

    /**
     * Get a single shipment by ID.
     */
    findById(id: string): ShipmentRow | null {
        const db = getDatabase();
        const result = db.exec(`SELECT * FROM shipments WHERE id = ?`, [id]);
        const rows = this.mapRows<ShipmentRow>(result);
        return rows[0] || null;
    }

    /**
     * Find shipment by shipment number.
     */
    findByShipmentNumber(shipmentNumber: string): ShipmentRow | null {
        const db = getDatabase();
        const result = db.exec(
            `SELECT * FROM shipments WHERE shipment_number = ?`,
            [shipmentNumber]
        );
        const rows = this.mapRows<ShipmentRow>(result);
        return rows[0] || null;
    }

    /**
     * Search shipments with multiple criteria.
     */
    search(params: ShipmentSearchParams): { data: ShipmentRow[]; total: number } {
        const db = getDatabase();
        const conditions: string[] = ['1=1'];
        const queryParams: any[] = [];
        const page = params.page || 1;
        const limit = params.limit || 20;
        const offset = (page - 1) * limit;

        if (params.q) {
            const qStr = `%${params.q}%`;
            conditions.push(`(s.bl_number LIKE ? OR s.shipment_number LIKE ? OR EXISTS (SELECT 1 FROM containers c WHERE c.shipment_id = s.id AND c.number LIKE ?))`);
            queryParams.push(qStr, qStr, qStr);
        }
        if (params.bl_number) {
            conditions.push(`s.bl_number LIKE ?`);
            queryParams.push(`%${params.bl_number}%`);
        }
        if (params.shipment_number) {
            conditions.push(`s.shipment_number LIKE ?`);
            queryParams.push(`%${params.shipment_number}%`);
        }
        if (params.container_number) {
            conditions.push(`EXISTS (SELECT 1 FROM containers c WHERE c.shipment_id = s.id AND c.number LIKE ?)`);
            queryParams.push(`%${params.container_number}%`);
        }
        if (params.vessel_name) {
            conditions.push(`s.vessel_name LIKE ?`);
            queryParams.push(`%${params.vessel_name}%`);
        }
        if (params.customer_name) {
            conditions.push(`s.customer_name LIKE ?`);
            queryParams.push(`%${params.customer_name}%`);
        }
        if (params.status) {
            conditions.push(`s.status = ?`);
            queryParams.push(params.status);
        }
        if (params.date_from) {
            conditions.push(`s.created_at >= ?`);
            queryParams.push(params.date_from);
        }
        if (params.date_to) {
            conditions.push(`s.created_at <= ?`);
            queryParams.push(params.date_to);
        }
        if (params.tracking_id) {
            conditions.push(`s.id IN (SELECT shipment_id FROM shipment_assignments WHERE tracking_id LIKE ?)`);
            queryParams.push(`%${params.tracking_id}%`);
        }

        const whereClause = conditions.join(' AND ');

        const countResult = db.exec(
            `SELECT COUNT(s.id) FROM shipments s WHERE ${whereClause}`,
            queryParams
        );
        const total = countResult.length > 0 ? (countResult[0].values[0][0] as number) : 0;

        const result = db.exec(
            `SELECT s.*
       FROM shipments s
       WHERE ${whereClause}
       ORDER BY s.updated_at DESC
       LIMIT ${limit} OFFSET ${offset}`,
            queryParams
        );

        const data = this.mapRows<ShipmentRow>(result);
        return { data, total };
    }

    /**
     * Create a new shipment.
     */
    create(shipment: Partial<ShipmentRow>): ShipmentRow {
        const db = getDatabase();
        const id = shipment.id || uuidv4();
        const now = new Date().toISOString();

        const fields = [
            'id', 'shipment_number', 'shipment_type', 'bl_number', 'booking_number',
            'customer_id', 'customer_name', 'shipper', 'consignee', 'sealine', 'sealine_name',
            'status', 'shipping_status', 'gross_weight', 'cbm', 'package_count', 'package_type',
            'commodity', 'incoterm', 'pickup_location', 'delivery_location',
            'pol_name', 'pol_locode', 'pol_country', 'pod_name', 'pod_locode', 'pod_country',
            'etd', 'eta', 'ata', 'atd', 'predictive_eta', 'cutoff_date', 'delivery_deadline',
            'vessel_name', 'vessel_imo', 'vessel_mmsi',
            'last_event', 'last_event_date', 'last_vessel_lat', 'last_vessel_lng', 'last_vessel_update',
            'notes', 'admin_notes', 'last_synced_at', 'raw_api_response',
            'created_at', 'updated_at'
        ];

        const values = fields.map((f) => {
            if (f === 'id') return id;
            if (f === 'created_at' || f === 'updated_at') return now;
            if (f === 'status') return (shipment as any)[f] || 'PLANNED';
            return (shipment as any)[f] ?? null;
        });

        const placeholders = fields.map(() => '?').join(', ');
        db.run(`INSERT INTO shipments (${fields.join(', ')}) VALUES (${placeholders})`, values);
        saveDatabase();

        return this.findById(id)!;
    }

    /**
     * Update an existing shipment.
     */
    update(id: string, updates: Partial<ShipmentRow>): ShipmentRow | null {
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

        setClauses.push(`updated_at = ?`);
        values.push(new Date().toISOString());
        values.push(id);

        db.run(`UPDATE shipments SET ${setClauses.join(', ')} WHERE id = ?`, values);
        saveDatabase();

        return this.findById(id);
    }

    /**
     * Delete a shipment by ID.
     */
    delete(id: string): boolean {
        const db = getDatabase();
        db.run(`DELETE FROM shipments WHERE id = '${id.replace(/'/g, "''")}'`);
        saveDatabase();
        return true;
    }

    // ─── Container Operations ──────────────────────────────

    findContainersByShipmentId(shipmentId: string): ContainerRow[] {
        const db = getDatabase();
        const result = db.exec(
            `SELECT * FROM containers WHERE shipment_id = '${shipmentId.replace(/'/g, "''")}'`
        );
        return this.mapRows<ContainerRow>(result);
    }

    createContainer(container: Partial<ContainerRow>): void {
        const db = getDatabase();
        const id = container.id || uuidv4();
        const now = new Date().toISOString();
        db.run(
            `INSERT INTO containers (id, shipment_id, number, iso_code, size_type, status, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [id, container.shipment_id ?? null, container.number ?? null, container.iso_code ?? null,
                container.size_type ?? null, container.status ?? null, now, now]
        );
    }

    deleteContainersByShipmentId(shipmentId: string): void {
        const db = getDatabase();
        db.run(`DELETE FROM containers WHERE shipment_id = '${shipmentId.replace(/'/g, "''")}'`);
    }

    // ─── Container Event Operations ───────────────────────

    findEventsByShipmentId(shipmentId: string): ContainerEventRow[] {
        const db = getDatabase();
        const result = db.exec(
            `SELECT * FROM container_events WHERE shipment_id = '${shipmentId.replace(/'/g, "''")}' ORDER BY date ASC`
        );
        return this.mapRows<ContainerEventRow>(result);
    }

    createContainerEvent(event: Partial<ContainerEventRow>): void {
        const db = getDatabase();
        const id = event.id || uuidv4();
        db.run(
            `INSERT INTO container_events (id, container_id, shipment_id, description, event_type, event_code,
       status, date, is_actual, is_additional_event, route_type, transport_type,
       location_name, location_country, location_locode, location_lat, location_lng,
       facility_name, vessel_name, vessel_imo, voyage)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [id, event.container_id ?? null, event.shipment_id ?? null, event.description ?? null, event.event_type ?? null,
                event.event_code ?? null, event.status ?? null, event.date ?? null, event.is_actual ?? 0,
                event.is_additional_event ?? 0, event.route_type ?? null, event.transport_type ?? null,
                event.location_name ?? null, event.location_country ?? null, event.location_locode ?? null,
                event.location_lat ?? null, event.location_lng ?? null, event.facility_name ?? null,
                event.vessel_name ?? null, event.vessel_imo ?? null, event.voyage ?? null]
        );
    }

    deleteEventsByShipmentId(shipmentId: string): void {
        const db = getDatabase();
        db.run(`DELETE FROM container_events WHERE shipment_id = '${shipmentId.replace(/'/g, "''")}'`);
    }

    // ─── Route Segment Operations ─────────────────────────

    findRouteSegmentsByShipmentId(shipmentId: string): RouteSegmentRow[] {
        const db = getDatabase();
        const result = db.exec(
            `SELECT * FROM route_segments WHERE shipment_id = '${shipmentId.replace(/'/g, "''")}'`
        );
        return this.mapRows<RouteSegmentRow>(result);
    }

    createRouteSegment(segment: Partial<RouteSegmentRow>): void {
        const db = getDatabase();
        const id = segment.id || uuidv4();
        db.run(
            `INSERT INTO route_segments (id, shipment_id, route_type, path_json, current_lat, current_lng)
       VALUES (?, ?, ?, ?, ?, ?)`,
            [id, segment.shipment_id ?? null, segment.route_type ?? null, segment.path_json ?? null,
                segment.current_lat ?? null, segment.current_lng ?? null]
        );
    }

    deleteRouteSegmentsByShipmentId(shipmentId: string): void {
        const db = getDatabase();
        db.run(`DELETE FROM route_segments WHERE shipment_id = '${shipmentId.replace(/'/g, "''")}'`);
    }

    // ─── Active Shipments ─────────────────────────────────

    findActiveShipments(): ShipmentRow[] {
        const db = getDatabase();
        const result = db.exec(
            `SELECT * FROM shipments WHERE status NOT IN ('COMPLETED', 'ARRIVED') ORDER BY updated_at DESC`
        );
        return this.mapRows<ShipmentRow>(result);
    }

    /**
     * Get summary statistics for the dashboard.
     */
    getDashboardStats(): Record<string, number> {
        const db = getDatabase();

        const totalResult = db.exec('SELECT COUNT(*) FROM shipments');
        const inTransitResult = db.exec("SELECT COUNT(*) FROM shipments WHERE status IN ('IN_TRANSIT', 'ON_SCHEDULE', 'GATE_IN', 'GATE_OUT', 'LOADED', 'SAILED')");
        const arrivedResult = db.exec("SELECT COUNT(*) FROM shipments WHERE status IN ('ARRIVED', 'AT_PORT', 'DISCHARGED', 'PICKED_UP', 'DROPPED_OFF')");
        const completedResult = db.exec("SELECT COUNT(*) FROM shipments WHERE status IN ('COMPLETED')");
        const delayedResult = db.exec("SELECT COUNT(*) FROM shipments WHERE status IN ('DELAYED', 'ON_HOLD', 'CANCELLED')");
        const plannedResult = db.exec("SELECT COUNT(*) FROM shipments WHERE status = 'PLANNED'");

        return {
            total: totalResult.length > 0 ? (totalResult[0].values[0][0] as number) : 0,
            in_transit: inTransitResult.length > 0 ? (inTransitResult[0].values[0][0] as number) : 0,
            arrived: arrivedResult.length > 0 ? (arrivedResult[0].values[0][0] as number) : 0,
            completed: completedResult.length > 0 ? (completedResult[0].values[0][0] as number) : 0,
            delayed: delayedResult.length > 0 ? (delayedResult[0].values[0][0] as number) : 0,
            planned: plannedResult.length > 0 ? (plannedResult[0].values[0][0] as number) : 0,
        };
    }

    // ─── Utility ──────────────────────────────────────────

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
