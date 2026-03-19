export interface InquiryRow {
    id: string;
    tracking_id: string;
    shipment_id: string | null;
    customer_name: string;
    customer_email: string | null;
    message: string | null;
    admin_response: string | null;
    status: string; // NEW, REPLIED, CLOSED
    created_at: string;
    updated_at: string;
}

export interface CreateInquiryInput {
    customer_name: string;
    customer_email?: string;
    message?: string;
    shipment_id?: string;
    tracking_id?: string;
}

export interface AdminRespondInput {
    admin_response: string;
    status: string;
}
