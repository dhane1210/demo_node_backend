/**
 * Types matching the Sinay/SafeCube Container Tracking API v2 response.
 */

export interface SinayShipmentResponse {
    metadata: SinayMetadata;
    locations: SinayLocation[];
    route: SinayRoute;
    vessels: SinayVessel[];
    facilities: SinayFacility[];
    containers: SinayContainer[];
    routeData?: SinayRouteData;
}

export interface SinayMetadata {
    shipmentType: string;
    shipmentNumber: string;
    sealine: string;
    sealineName: string;
    shippingStatus: string;
    updatedAt: string;
}

export interface SinayLocation {
    name: string | null;
    state: string | null;
    country: string | null;
    countryCode: string | null;
    locode: string | null;
    coordinates: { lat: number | null; lng: number | null };
    timezone: string | null;
}

export interface SinayRoutePoint {
    location: SinayLocation;
    date: string | null;
    actual: boolean;
    predictiveEta: string | null;
}

export interface SinayRoute {
    prepol: SinayRoutePoint | null;
    pol: SinayRoutePoint | null;
    pod: SinayRoutePoint | null;
    postpod: SinayRoutePoint | null;
}

export interface SinayVessel {
    name: string | null;
    imo: number | null;
    callSign: string | null;
    mmsi: number | null;
    flag: string | null;
}

export interface SinayFacility {
    name: string | null;
    countryCode: string | null;
    locode: string | null;
    bicCode: string | null;
    smdgCode: string | null;
    coordinates: { lat: number | null; lng: number | null };
}

export interface SinayContainerEvent {
    location: SinayLocation | null;
    facility: SinayFacility | null;
    description: string;
    eventType: string;
    eventCode: string;
    status: string;
    date: string;
    isActual: boolean;
    isAdditionalEvent: boolean;
    routeType: string;
    transportType: string | null;
    vessel: SinayVessel | null;
    voyage: string | null;
}

export interface SinayContainer {
    number: string;
    isoCode: string | null;
    sizeType: string | null;
    status: string;
    events: SinayContainerEvent[];
}

export interface SinayRouteSegment {
    path: Array<{ lat: number; lng: number }>;
    routeType: string;
}

export interface SinayAISData {
    status: string;
    data: {
        lastEvent: {
            description: string;
            date: string;
            voyage: string;
        } | null;
        dischargePort: unknown;
        vessel: SinayVessel | null;
        lastVesselPosition: {
            lat: number;
            lng: number;
            updatedAt: string;
        } | null;
        departurePort: {
            name: string | null;
            countryCode: string;
            code: string;
            date: string;
            dateLabel: string;
        } | null;
        arrivalPort: {
            name: string | null;
            countryCode: string;
            code: string;
            date: string;
            dateLabel: string;
        } | null;
        updatedAt: string;
    } | null;
}

export interface SinayRouteData {
    routeSegments: SinayRouteSegment[];
    coordinates: { lat: number; lng: number } | null;
    ais: SinayAISData | null;
}

export interface SinayShipmentParams {
    shipmentNumber: string;
    sealine?: string;
    route?: boolean;
    ais?: boolean;
}
