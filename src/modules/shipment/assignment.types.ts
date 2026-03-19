export interface ShipmentAssignment {
    id: string;
    shipment_id: string;
    customer_id?: string;
    tracking_id: string;
    customer_name: string;
    customer_email: string;
    assigned_by?: string;
    notes?: string;
    created_at: string;
    updated_at: string;
}

export interface CreateAssignmentInput {
    shipment_id: string;
    customer_id?: string;
    customer_name: string;
    customer_email: string;
    notes?: string;
}
