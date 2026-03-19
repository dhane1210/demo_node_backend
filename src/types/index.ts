// ─────────────────────────────────────────────────────────────
// Shared TypeScript types for the Logistics Platform
// ─────────────────────────────────────────────────────────────

/** Shipment status values */
export type ShipmentStatus = 'ON_SCHEDULE' | 'DELAYED' | 'ARRIVED' | 'COMPLETED' | 'IN_TRANSIT' | 'PLANNED';

/** Alert severity levels */
export type AlertSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

/** Alert status */
export type AlertStatus = 'OPEN' | 'ACKNOWLEDGED' | 'RESOLVED';

/** Job pricing status */
export type JobStatus = 'PENDING' | 'AGENT_RATE_RECEIVED' | 'WAITING_ON_AGENT' | 'COMPLETED';

/** Calendar event types */
export type CalendarEventType = 'ETD' | 'ETA' | 'CUTOFF' | 'DELIVERY_DEADLINE';

/** Email template types */
export type EmailTemplateType = 'SHIPMENT_UPDATE' | 'DELAY_NOTICE' | 'ARRIVAL_NOTICE' | 'DELIVERY_CONFIRMATION';

/** Coordinates */
export interface Coordinates {
    lat: number | null;
    lng: number | null;
}

/** Location */
export interface Location {
    name: string | null;
    state: string | null;
    country: string | null;
    countryCode: string | null;
    locode: string | null;
    coordinates: Coordinates;
    timezone: string | null;
}

/** Vessel */
export interface Vessel {
    name: string | null;
    imo: number | null;
    callSign: string | null;
    mmsi: number | null;
    flag: string | null;
}

/** Facility */
export interface Facility {
    name: string | null;
    countryCode: string | null;
    locode: string | null;
    bicCode: string | null;
    smdgCode: string | null;
    coordinates: Coordinates;
}

/** Pagination params */
export interface PaginationParams {
    page: number;
    limit: number;
}

/** Base row with timestamps */
export interface BaseRow {
    id: string;
    created_at: string;
    updated_at: string;
}
