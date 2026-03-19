import { getDatabase, saveDatabase } from '../config/database';
import { v4 as uuidv4 } from 'uuid';
import { logger } from '../utils/logger';

/**
 * Seeds the database with initial data (email templates, sample customer, etc.)
 */
export function seedDatabase(): void {
    const db = getDatabase();

    logger.info('Seeding database...');

    // Check if already seeded
    const result = db.exec('SELECT COUNT(*) as count FROM email_templates');
    const count = result.length > 0 ? result[0].values[0][0] as number : 0;
    if (count > 0) {
        logger.info('Database already seeded, skipping');
        return;
    }

    // ─── Email Templates ────────────────────────────────────
    const templates = [
        {
            id: uuidv4(),
            type: 'SHIPMENT_UPDATE',
            name: 'Shipment Update',
            subject: 'Shipment Update - {{shipment_number}}',
            body: `Dear {{customer_name}},

We would like to provide you with an update on your shipment.

Shipment Number: {{shipment_number}}
BL Number: {{bl_number}}
Vessel: {{vessel_name}}
Current Location: {{current_location}}
Route: {{pol_name}} → {{pod_name}}
ETA: {{eta}}
Status: {{status}}

If you have any questions, please don't hesitate to contact us.

Best regards,
Logistics Team`,
        },
        {
            id: uuidv4(),
            type: 'DELAY_NOTICE',
            name: 'Delay Notice',
            subject: 'Delay Notice - Shipment {{shipment_number}}',
            body: `Dear {{customer_name}},

We regret to inform you that your shipment has been delayed.

Shipment Number: {{shipment_number}}
BL Number: {{bl_number}}
Vessel: {{vessel_name}}
Original ETA: {{original_eta}}
Revised ETA: {{eta}}
Reason: {{delay_reason}}

We apologize for any inconvenience and will keep you updated on any further changes.

Best regards,
Logistics Team`,
        },
        {
            id: uuidv4(),
            type: 'ARRIVAL_NOTICE',
            name: 'Arrival Notice',
            subject: 'Arrival Notice - Shipment {{shipment_number}}',
            body: `Dear {{customer_name}},

We are pleased to inform you that your shipment has arrived.

Shipment Number: {{shipment_number}}
BL Number: {{bl_number}}
Vessel: {{vessel_name}}
Port of Discharge: {{pod_name}}
Arrival Date: {{arrival_date}}

Please arrange for customs clearance and cargo pickup at your earliest convenience.

Best regards,
Logistics Team`,
        },
        {
            id: uuidv4(),
            type: 'DELIVERY_CONFIRMATION',
            name: 'Delivery Confirmation',
            subject: 'Delivery Confirmation - Shipment {{shipment_number}}',
            body: `Dear {{customer_name}},

We are pleased to confirm that your shipment has been delivered.

Shipment Number: {{shipment_number}}
BL Number: {{bl_number}}
Delivery Date: {{delivery_date}}
Delivery Location: {{delivery_location}}

Thank you for choosing our services.

Best regards,
Logistics Team`,
        },
    ];

    const insertTemplate = `INSERT INTO email_templates (id, type, name, subject, body) VALUES (?, ?, ?, ?, ?)`;
    for (const t of templates) {
        db.run(insertTemplate, [t.id, t.type, t.name, t.subject, t.body]);
    }

    // ─── Sample Customer ────────────────────────────────────
    const customerId = uuidv4();
    db.run(
        `INSERT INTO customers (id, name, email, company, phone, contact_person) VALUES (?, ?, ?, ?, ?, ?)`,
        [customerId, 'John Smith', 'john@acmecorp.com', 'ACME Corporation', '+1-555-0100', 'John Smith']
    );

    saveDatabase();
    logger.info('Database seeded successfully');
}
