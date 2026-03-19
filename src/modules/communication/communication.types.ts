export interface EmailTemplateRow {
    id: string;
    type: string;
    name: string;
    subject: string;
    body: string;
    is_active: number;
    created_at: string;
    updated_at: string;
}

export interface EmailLogRow {
    id: string;
    shipment_id: string | null;
    template_id: string | null;
    recipient_email: string;
    recipient_name: string | null;
    subject: string;
    body: string;
    status: string;
    staff_member: string | null;
    sent_at: string;
    created_at: string;
}

export interface SendEmailRequest {
    shipment_id?: string;
    template_id: string;
    recipient_email: string;
    recipient_name?: string;
    subject: string;
    body: string;
    staff_member?: string;
    attachments?: { filename: string; content: string; encoding: string }[];
}
