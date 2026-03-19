
import { getDatabase, saveDatabase } from '../config/database';
import { logger } from '../utils/logger';

/**
 * Run all database migrations - creates all tables for the logistics platform.
 */
export function runMigrations(): void {
  const db = getDatabase();

  logger.info('Running database migrations...');

  // ─── 1. Customers ─────────────────────────────────────────
  db.run(`
    CREATE TABLE IF NOT EXISTS customers (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT,
      company TEXT,
      phone TEXT,
      address TEXT,
      contact_person TEXT,
      notes TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);

  // ─── 2. Vessels ───────────────────────────────────────────
  db.run(`
    CREATE TABLE IF NOT EXISTS vessels (
      id TEXT PRIMARY KEY,
      name TEXT,
      imo INTEGER,
      call_sign TEXT,
      mmsi INTEGER,
      flag TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);

  // ─── 3. Locations ─────────────────────────────────────────
  db.run(`
    CREATE TABLE IF NOT EXISTS locations (
      id TEXT PRIMARY KEY,
      name TEXT,
      state TEXT,
      country TEXT,
      country_code TEXT,
      locode TEXT,
      lat REAL,
      lng REAL,
      timezone TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);

  // ─── 4. Facilities ────────────────────────────────────────
  db.run(`
    CREATE TABLE IF NOT EXISTS facilities (
      id TEXT PRIMARY KEY,
      name TEXT,
      country_code TEXT,
      locode TEXT,
      bic_code TEXT,
      smdg_code TEXT,
      lat REAL,
      lng REAL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);

  // ─── 5. Shipments ────────────────────────────────────────
  db.run(`
    CREATE TABLE IF NOT EXISTS shipments (
      id TEXT PRIMARY KEY,
      shipment_number TEXT,
      shipment_type TEXT DEFAULT 'CT',
      bl_number TEXT,
      booking_number TEXT,
      customer_id TEXT REFERENCES customers(id),
      customer_name TEXT,
      shipper TEXT,
      consignee TEXT,
      sealine TEXT,
      sealine_name TEXT,
      status TEXT NOT NULL DEFAULT 'PLANNED',
      shipping_status TEXT,
      gross_weight REAL,
      cbm REAL,
      package_count INTEGER,
      package_type TEXT,
      commodity TEXT,
      incoterm TEXT,
      pickup_location TEXT,
      delivery_location TEXT,
      pol_name TEXT,
      pol_locode TEXT,
      pol_country TEXT,
      pod_name TEXT,
      pod_locode TEXT,
      pod_country TEXT,
      etd TEXT,
      eta TEXT,
      ata TEXT,
      atd TEXT,
      predictive_eta TEXT,
      vessel_name TEXT,
      vessel_imo INTEGER,
      vessel_mmsi INTEGER,
      last_event TEXT,
      last_event_date TEXT,
      last_vessel_lat REAL,
      last_vessel_lng REAL,
      last_vessel_update TEXT,
      notes TEXT,
      admin_notes TEXT,
      last_synced_at TEXT,
      raw_api_response TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);

  // Add cutoff_date and delivery_deadline columns if they don't exist
  try { db.run(`ALTER TABLE shipments ADD COLUMN cutoff_date TEXT;`); } catch (_) { /* column already exists */ }
  try { db.run(`ALTER TABLE shipments ADD COLUMN delivery_deadline TEXT;`); } catch (_) { /* column already exists */ }

  // ─── 6. Containers ───────────────────────────────────────
  db.run(`
    CREATE TABLE IF NOT EXISTS containers (
      id TEXT PRIMARY KEY,
      shipment_id TEXT NOT NULL REFERENCES shipments(id) ON DELETE CASCADE,
      number TEXT NOT NULL,
      iso_code TEXT,
      size_type TEXT,
      status TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);

  // ─── 7. Container Events ─────────────────────────────────
  db.run(`
    CREATE TABLE IF NOT EXISTS container_events (
      id TEXT PRIMARY KEY,
      container_id TEXT NOT NULL REFERENCES containers(id) ON DELETE CASCADE,
      shipment_id TEXT NOT NULL REFERENCES shipments(id) ON DELETE CASCADE,
      description TEXT,
      event_type TEXT,
      event_code TEXT,
      status TEXT,
      date TEXT,
      is_actual INTEGER DEFAULT 0,
      is_additional_event INTEGER DEFAULT 0,
      route_type TEXT,
      transport_type TEXT,
      location_name TEXT,
      location_country TEXT,
      location_locode TEXT,
      location_lat REAL,
      location_lng REAL,
      facility_name TEXT,
      vessel_name TEXT,
      vessel_imo INTEGER,
      voyage TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);

  // ─── 8. Route Segments ───────────────────────────────────
  db.run(`
    CREATE TABLE IF NOT EXISTS route_segments (
      id TEXT PRIMARY KEY,
      shipment_id TEXT NOT NULL REFERENCES shipments(id) ON DELETE CASCADE,
      route_type TEXT,
      path_json TEXT,
      current_lat REAL,
      current_lng REAL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);

  // ─── 9. Alerts ───────────────────────────────────────────
  db.run(`
    CREATE TABLE IF NOT EXISTS alerts (
      id TEXT PRIMARY KEY,
      shipment_id TEXT REFERENCES shipments(id) ON DELETE SET NULL,
      shipment_number TEXT,
      alert_type TEXT NOT NULL,
      alert_info TEXT,
      severity TEXT NOT NULL DEFAULT 'MEDIUM',
      status TEXT NOT NULL DEFAULT 'OPEN',
      detection_date TEXT NOT NULL DEFAULT (datetime('now')),
      action_taken TEXT,
      resolved_at TEXT,
      resolved_by TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);

  // ─── 10. Email Templates ─────────────────────────────────
  db.run(`
    CREATE TABLE IF NOT EXISTS email_templates (
      id TEXT PRIMARY KEY,
      type TEXT NOT NULL,
      name TEXT NOT NULL,
      subject TEXT NOT NULL,
      body TEXT NOT NULL,
      is_active INTEGER DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);

  // ─── 11. Email Logs ──────────────────────────────────────
  db.run(`
    CREATE TABLE IF NOT EXISTS email_logs (
      id TEXT PRIMARY KEY,
      shipment_id TEXT REFERENCES shipments(id) ON DELETE SET NULL,
      template_id TEXT REFERENCES email_templates(id),
      recipient_email TEXT NOT NULL,
      recipient_name TEXT,
      subject TEXT NOT NULL,
      body TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'SENT',
      staff_member TEXT,
      sent_at TEXT NOT NULL DEFAULT (datetime('now')),
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);

  // ─── 12. Jobs (Pricing Job Entries) ──────────────────────
  db.run(`
    CREATE TABLE IF NOT EXISTS jobs (
      id TEXT PRIMARY KEY,
      customer_id TEXT REFERENCES customers(id),
      shipper TEXT,
      consignee TEXT,
      commodity TEXT,
      package_contains TEXT,
      package_type TEXT,
      date_needed TEXT,
      weight REAL,
      cbm REAL,
      incoterm TEXT,
      pickup TEXT,
      delivery TEXT,
      additional_notes TEXT,
      status TEXT NOT NULL DEFAULT 'PENDING',
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);

  // ─── 13. Pricing ─────────────────────────────────────────
  db.run(`
    CREATE TABLE IF NOT EXISTS pricing (
      id TEXT PRIMARY KEY,
      job_id TEXT NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
      agent_rate REAL,
      clearance_charges REAL DEFAULT 0,
      delivery_order REAL DEFAULT 0,
      vat REAL DEFAULT 0,
      markup_percent REAL DEFAULT 0,
      total_cost REAL DEFAULT 0,
      selling_price REAL DEFAULT 0,
      profit_value REAL DEFAULT 0,
      profit_margin_percent REAL DEFAULT 0,
      currency TEXT DEFAULT 'USD',
      notes TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);

  // ─── 14. Calendar Events ─────────────────────────────────
  db.run(`
    CREATE TABLE IF NOT EXISTS calendar_events (
      id TEXT PRIMARY KEY,
      shipment_id TEXT REFERENCES shipments(id) ON DELETE CASCADE,
      event_type TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      event_date TEXT NOT NULL,
      all_day INTEGER DEFAULT 1,
      color TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);

  // ─── 15. API Sync Logs ───────────────────────────────────
  db.run(`
    CREATE TABLE IF NOT EXISTS api_sync_logs (
      id TEXT PRIMARY KEY,
      sync_type TEXT NOT NULL,
      status TEXT NOT NULL,
      shipments_synced INTEGER DEFAULT 0,
      shipments_failed INTEGER DEFAULT 0,
      error_message TEXT,
      started_at TEXT NOT NULL DEFAULT (datetime('now')),
      completed_at TEXT,
      duration_ms INTEGER,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);

  // ─── 16. Webhook Logs ────────────────────────────────────
  db.run(`
    CREATE TABLE IF NOT EXISTS webhook_logs (
      id TEXT PRIMARY KEY,
      event_type TEXT,
      payload TEXT,
      source TEXT,
      processed INTEGER DEFAULT 0,
      processed_at TEXT,
      error_message TEXT,
      received_at TEXT NOT NULL DEFAULT (datetime('now')),
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);

  // ─── 17. Shipment Documents ──────────────────────────────
  db.run(`
    CREATE TABLE IF NOT EXISTS shipment_documents (
      id TEXT PRIMARY KEY,
      shipment_id TEXT NOT NULL REFERENCES shipments(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      type TEXT,
      url TEXT NOT NULL,
      size INTEGER,
      uploaded_by TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);

  // ─── 18. Customer Inquiries ──────────────────────────────
  db.run(`
    CREATE TABLE IF NOT EXISTS customer_inquiries (
      id TEXT PRIMARY KEY,
      tracking_id TEXT NOT NULL,
      shipment_id TEXT REFERENCES shipments(id) ON DELETE SET NULL,
      customer_name TEXT NOT NULL,
      customer_email TEXT,
      message TEXT,
      admin_response TEXT,
      status TEXT NOT NULL DEFAULT 'NEW',  -- NEW, REPLIED, CLOSED
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);

  // ─── 19. Shipment Assignments ────────────────────────────
  db.run(`
    CREATE TABLE IF NOT EXISTS shipment_assignments (
      id TEXT PRIMARY KEY,
      shipment_id TEXT NOT NULL REFERENCES shipments(id) ON DELETE CASCADE,
      customer_id TEXT REFERENCES customers(id),
      tracking_id TEXT UNIQUE NOT NULL,
      customer_name TEXT NOT NULL,
      customer_email TEXT NOT NULL,
      assigned_by TEXT,
      notes TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);

  // Add customer_id if it doesn't exist
  try { db.run(`ALTER TABLE shipment_assignments ADD COLUMN customer_id TEXT REFERENCES customers(id);`); } catch (_) { /* column already exists */ }

  // ─── Indexes ─────────────────────────────────────────────
  db.run(`CREATE INDEX IF NOT EXISTS idx_shipments_status ON shipments(status);`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_shipments_customer ON shipments(customer_id);`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_shipments_bl ON shipments(bl_number);`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_shipments_number ON shipments(shipment_number);`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_containers_shipment ON containers(shipment_id);`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_container_events_container ON container_events(container_id);`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_container_events_shipment ON container_events(shipment_id);`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_alerts_shipment ON alerts(shipment_id);`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_alerts_status ON alerts(status);`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_email_logs_shipment ON email_logs(shipment_id);`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_jobs_status ON jobs(status);`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_calendar_events_date ON calendar_events(event_date);`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_calendar_events_shipment ON calendar_events(shipment_id);`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_shipment_documents_shipment ON shipment_documents(shipment_id);`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_customer_inquiries_tracking ON customer_inquiries(tracking_id);`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_shipment_assignments_tracking ON shipment_assignments(tracking_id);`);

  saveDatabase();
  logger.info('All database migrations completed successfully');
}
