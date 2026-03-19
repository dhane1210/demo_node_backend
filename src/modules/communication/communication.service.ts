import nodemailer from 'nodemailer';
import { CommunicationRepository } from './communication.repository';
import { SendEmailRequest } from './communication.types';
import { config } from '../../config';
import { logger } from '../../utils/logger';
import { getDatabase } from '../../config/database';

export class CommunicationService {
    private repository: CommunicationRepository;
    private transporter: nodemailer.Transporter;

    constructor() {
        this.repository = new CommunicationRepository();
        const transportOpts: any = {
            host: config.smtp.host,
            port: config.smtp.port,
            secure: config.smtp.secure,
            auth: config.smtp.user ? {
                user: config.smtp.user,
                pass: config.smtp.pass,
            } : undefined,
        };

        // If using Gmail, rely on Nodemailer's built-in well-known service profile
        // This bypasses manual DNS/Port timeouts (like queryA ETIMEOUT) on strict networks.
        if (config.smtp.host.includes('gmail.com')) {
            transportOpts.service = 'gmail';
        }

        this.transporter = nodemailer.createTransport(transportOpts);
    }

    async getTemplates() { return this.repository.findAllTemplates(); }

    /**
     * Get a template with auto-filled shipment data.
     */
    async getTemplateWithData(templateId: string, shipmentId?: string) {
        const template = this.repository.findTemplateById(templateId);
        if (!template) return null;

        if (!shipmentId) return template;

        // Get shipment data for auto-fill
        const db = getDatabase();
        const result = db.exec(
            `SELECT s.*, c.number as container_number FROM shipments s
       LEFT JOIN containers c ON c.shipment_id = s.id
       WHERE s.id = '${shipmentId.replace(/'/g, "''")}'`
        );

        if (!result.length) return template;

        const columns = result[0].columns;
        const row = result[0].values[0];
        const shipment: any = {};
        columns.forEach((col: string, i: number) => { shipment[col] = row[i]; });

        // Auto-fill template placeholders
        const replacements: Record<string, string> = {
            '{{shipment_number}}': shipment.shipment_number || '',
            '{{bl_number}}': shipment.bl_number || '',
            '{{customer_name}}': shipment.customer_name || '',
            '{{vessel_name}}': shipment.vessel_name || '',
            '{{current_location}}': shipment.last_event || '',
            '{{eta}}': shipment.eta || '',
            '{{etd}}': shipment.etd || '',
            '{{status}}': shipment.status || '',
            '{{pol_name}}': shipment.pol_name || '',
            '{{pod_name}}': shipment.pod_name || '',
            '{{container_number}}': shipment.container_number || '',
            '{{original_eta}}': shipment.eta || '',
            '{{delay_reason}}': '',
            '{{arrival_date}}': shipment.ata || shipment.eta || '',
            '{{delivery_date}}': '',
            '{{delivery_location}}': shipment.delivery_location || shipment.pod_name || '',
        };

        let subject = template.subject;
        let body = template.body;
        for (const [key, value] of Object.entries(replacements)) {
            subject = subject.replace(new RegExp(key.replace(/[{}]/g, '\\$&'), 'g'), value);
            body = body.replace(new RegExp(key.replace(/[{}]/g, '\\$&'), 'g'), value);
        }

        return { ...template, subject, body };
    }

    /**
     * Send an email and log it.
     */
    async sendEmail(request: SendEmailRequest) {
        try {
            // Attempt to send via SMTP (will fail gracefully if not configured)
            if (config.smtp.pass) {
                await this.transporter.sendMail({
                    from: config.smtp.from,
                    to: request.recipient_email,
                    subject: request.subject,
                    text: request.body,
                    attachments: request.attachments,
                });
                logger.info(`Email sent to ${request.recipient_email}: ${request.subject}`);
            } else {
                logger.warn('SMTP App Password not configured — email logged but not sent');
            }

            // Always log the email
            const log = this.repository.createEmailLog({
                shipment_id: request.shipment_id,
                template_id: request.template_id,
                recipient_email: request.recipient_email,
                recipient_name: request.recipient_name,
                subject: request.subject,
                body: request.body,
                status: config.smtp.pass ? 'SENT' : 'LOGGED',
                staff_member: request.staff_member,
            });

            return log;
        } catch (error: any) {
            logger.error('Failed to send email:', error);

            // Log as failed
            const log = this.repository.createEmailLog({
                shipment_id: request.shipment_id,
                template_id: request.template_id,
                recipient_email: request.recipient_email,
                recipient_name: request.recipient_name,
                subject: request.subject,
                body: request.body,
                status: 'FAILED',
                staff_member: request.staff_member,
            });

            return log;
        }
    }

    async getEmailLogs(shipmentId?: string, page: number = 1, limit: number = 20) {
        if (shipmentId) {
            return { data: this.repository.findLogsByShipmentId(shipmentId), total: 0 };
        }
        return this.repository.findAllLogs(page, limit);
    }
}
