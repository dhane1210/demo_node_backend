export interface AlertRow {
    id: string;
    shipment_id: string | null;
    shipment_number: string | null;
    alert_type: string;
    alert_info: string | null;
    severity: string;
    status: string;
    detection_date: string;
    action_taken: string | null;
    resolved_at: string | null;
    resolved_by: string | null;
    created_at: string;
    updated_at: string;
}
