import { z } from 'zod';

// ─── Shipment Types ────────────────────────────────────────

export interface ShipmentRow {
    id: string;
    shipment_number: string | null;
    shipment_type: string | null;
    bl_number: string | null;
    booking_number: string | null;
    customer_id: string | null;
    customer_name: string | null;
    shipper: string | null;
    consignee: string | null;
    sealine: string | null;
    sealine_name: string | null;
    status: string;
    shipping_status: string | null;
    gross_weight: number | null;
    cbm: number | null;
    package_count: number | null;
    package_type: string | null;
    commodity: string | null;
    incoterm: string | null;
    pickup_location: string | null;
    delivery_location: string | null;
    pol_name: string | null;
    pol_locode: string | null;
    pol_country: string | null;
    pod_name: string | null;
    pod_locode: string | null;
    pod_country: string | null;
    etd: string | null;
    eta: string | null;
    ata: string | null;
    atd: string | null;
    predictive_eta: string | null;
    cutoff_date: string | null;
    delivery_deadline: string | null;
    vessel_name: string | null;
    vessel_imo: number | null;
    vessel_mmsi: number | null;
    last_event: string | null;
    last_event_date: string | null;
    last_vessel_lat: number | null;
    last_vessel_lng: number | null;
    last_vessel_update: string | null;
    notes: string | null;
    admin_notes: string | null;
    last_synced_at: string | null;
    raw_api_response: string | null;
    created_at: string;
    updated_at: string;
}

export interface ContainerRow {
    id: string;
    shipment_id: string;
    number: string;
    iso_code: string | null;
    size_type: string | null;
    status: string | null;
    created_at: string;
    updated_at: string;
}

export interface ContainerEventRow {
    id: string;
    container_id: string;
    shipment_id: string;
    description: string | null;
    event_type: string | null;
    event_code: string | null;
    status: string | null;
    date: string | null;
    is_actual: number;
    is_additional_event: number;
    route_type: string | null;
    transport_type: string | null;
    location_name: string | null;
    location_country: string | null;
    location_locode: string | null;
    location_lat: number | null;
    location_lng: number | null;
    facility_name: string | null;
    vessel_name: string | null;
    vessel_imo: number | null;
    voyage: string | null;
    created_at: string;
}

export interface RouteSegmentRow {
    id: string;
    shipment_id: string;
    route_type: string | null;
    path_json: string | null;
    current_lat: number | null;
    current_lng: number | null;
    created_at: string;
}

export interface ShipmentSearchParams {
    q?: string;
    bl_number?: string;
    container_number?: string;
    shipment_number?: string;
    vessel_name?: string;
    customer_name?: string;
    date_from?: string;
    date_to?: string;
    status?: string;
    tracking_id?: string;
    page?: number;
    limit?: number;
}

export interface ShipmentDashboardItem {
    id: string;
    shipment_number: string | null;
    customer_name: string | null;
    etd: string | null;
    eta: string | null;
    status: string;
    last_event: string | null;
    container_number: string | null;
    vessel_name: string | null;
    pol_name: string | null;
    pod_name: string | null;
    created_at: string;
}
