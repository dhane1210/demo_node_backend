export interface CalendarEventRow {
    id: string;
    shipment_id: string | null;
    event_type: string;
    title: string;
    description: string | null;
    event_date: string;
    all_day: number;
    color: string | null;
    created_at: string;
    updated_at: string;
}
