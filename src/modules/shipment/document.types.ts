export interface ShipmentDocumentRow {
    id: string;
    shipment_id: string;
    name: string;
    type: string | null;
    url: string;
    size: number | null;
    uploaded_by: string | null;
    created_at: string;
    updated_at: string;
}
