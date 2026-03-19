import { v4 as uuidv4 } from 'uuid';
import { SinayShipmentResponse } from './sinay.types';

/**
 * Maps Sinay API response data to internal database models.
 */
export class SinayMapper {
    /**
     * Map Sinay API response to shipment DB record fields.
     */
    static mapToShipment(response: SinayShipmentResponse, existingId?: string) {
        if (!response || !response.metadata) {
            throw new Error('Invalid Sinay API response: missing metadata');
        }
        const { metadata, route, vessels, routeData } = response;
        const primaryVessel = vessels?.[0];
        const aisData = routeData?.ais?.data;
        const lastEvent = aisData?.lastEvent;
        const lastPosition = aisData?.lastVesselPosition;
        let derivedStatus = SinayMapper.mapShippingStatus(metadata.shippingStatus);
        
        let latestContainerEvent: any = null;
        
        // If it's IN_TRANSIT or PLANNED, try to get a more granular status from events
        if (derivedStatus === 'IN_TRANSIT' || derivedStatus === 'PLANNED') {
            const aisEventCode = (lastEvent as any)?.eventCode || lastEvent?.description;
            // Let's also check the container events if available
            if (response.containers && response.containers.length > 0) {
                const events = response.containers[0].events || [];
                if (events.length > 0) {
                    latestContainerEvent = events[events.length - 1]; // Assuming they are chronologically ordered by Sinay
                }
            }
            
            const eventToCheck = latestContainerEvent?.eventCode || aisEventCode || latestContainerEvent?.description;
            if (eventToCheck) {
                const granular = SinayMapper.mapEventCodeToStatus(eventToCheck);
                if (granular) derivedStatus = granular;
            }
        }

        return {
            id: existingId || uuidv4(),
            shipment_number: metadata.shipmentNumber,
            shipment_type: metadata.shipmentType,
            sealine: metadata.sealine,
            sealine_name: metadata.sealineName,
            shipping_status: metadata.shippingStatus,
            pol_name: route?.pol?.location?.name || null,
            pol_locode: route?.pol?.location?.locode || null,
            pol_country: route?.pol?.location?.country || null,
            pod_name: route?.pod?.location?.name || null,
            pod_locode: route?.pod?.location?.locode || null,
            pod_country: route?.pod?.location?.country || null,
            etd: route?.pol?.date || null,
            eta: route?.pod?.date || null,
            predictive_eta: route?.pod?.predictiveEta || null,
            vessel_name: primaryVessel?.name || null,
            vessel_imo: primaryVessel?.imo || null,
            vessel_mmsi: primaryVessel?.mmsi || null,
            last_event: lastEvent?.description || latestContainerEvent?.description || null,
            last_event_date: lastEvent?.date || latestContainerEvent?.date || null,
            last_vessel_lat: lastPosition?.lat || null,
            last_vessel_lng: lastPosition?.lng || null,
            last_vessel_update: lastPosition?.updatedAt || aisData?.updatedAt || null,
            last_synced_at: new Date().toISOString(),
            raw_api_response: JSON.stringify(response),
            status: derivedStatus,
        };
    }

    /**
     * Map containers from API response.
     */
    static mapContainers(response: SinayShipmentResponse, shipmentId: string) {
        return (response.containers || []).map((container) => ({
            id: uuidv4(),
            shipment_id: shipmentId,
            number: container.number,
            iso_code: container.isoCode,
            size_type: container.sizeType,
            status: container.status,
        }));
    }

    /**
     * Map container events from API response.
     */
    static mapContainerEvents(response: SinayShipmentResponse, shipmentId: string, containerIdMap: Map<string, string>) {
        const events: any[] = [];

        for (const container of response.containers || []) {
            const containerId = containerIdMap.get(container.number);
            if (!containerId) continue;

            for (const event of container.events || []) {
                events.push({
                    id: uuidv4(),
                    container_id: containerId,
                    shipment_id: shipmentId,
                    description: event.description,
                    event_type: event.eventType,
                    event_code: event.eventCode,
                    status: event.status,
                    date: event.date,
                    is_actual: event.isActual ? 1 : 0,
                    is_additional_event: event.isAdditionalEvent ? 1 : 0,
                    route_type: event.routeType,
                    transport_type: event.transportType,
                    location_name: event.location?.name || null,
                    location_country: event.location?.country || null,
                    location_locode: event.location?.locode || null,
                    location_lat: event.location?.coordinates?.lat || null,
                    location_lng: event.location?.coordinates?.lng || null,
                    facility_name: event.facility?.name || null,
                    vessel_name: event.vessel?.name || null,
                    vessel_imo: event.vessel?.imo || null,
                    voyage: event.voyage,
                });
            }
        }

        return events;
    }

    /**
     * Map route segments from API response.
     */
    static mapRouteSegments(response: SinayShipmentResponse, shipmentId: string) {
        if (!response.routeData?.routeSegments) return [];

        return response.routeData.routeSegments.map((segment) => ({
            id: uuidv4(),
            shipment_id: shipmentId,
            route_type: segment.routeType,
            path_json: JSON.stringify(segment.path),
            current_lat: response.routeData?.coordinates?.lat || null,
            current_lng: response.routeData?.coordinates?.lng || null,
        }));
    }

    /**
     * Map Sinay shipping status to our internal status.
     */
    static mapShippingStatus(sinayStatus: string): string {
        const statusMap: Record<string, string> = {
            PLANNED: 'PLANNED',
            IN_TRANSIT: 'IN_TRANSIT',
            UNDER_SHIPMENT: 'IN_TRANSIT',
            ON_BOARD: 'IN_TRANSIT',
            AT_PORT: 'ARRIVED',
            DISCHARGED: 'ARRIVED',
            DELIVERED: 'COMPLETED',
            ARRIVED: 'ARRIVED',
            GATE_OUT: 'COMPLETED',
            NOT_FOUND: 'PLANNED',
            DELAYED: 'DELAYED',
        };
        return statusMap[sinayStatus] || 'IN_TRANSIT';
    }

    /**
     * Map specific event codes to granular statuses
     */
    static mapEventCodeToStatus(eventCodeOrDesc: string): string | null {
        if (!eventCodeOrDesc) return null;
        
        const code = eventCodeOrDesc.toUpperCase();
        
        // Match DCSA Event Codes
        if (code === 'GTIN' || code.includes('GATE IN')) return 'GATE_IN';
        if (code === 'GTOT' || code.includes('GATE OUT')) return 'GATE_OUT';
        if (code === 'LOAD' || code.includes('LOAD')) return 'LOADED';
        if (code === 'DISC' || code.includes('DISCHARGE')) return 'DISCHARGED';
        if (code === 'DEPA' || code.includes('DEPARTURE')) return 'SAILED';
        if (code === 'ARRI' || code.includes('ARRIVAL')) return 'AT_PORT';
        if (code === 'PICK' || code.includes('PICK')) return 'PICKED_UP';
        if (code === 'DROP' || code.includes('DROP')) return 'DROPPED_OFF';
        if (code === 'CANC' || code.includes('CANCEL')) return 'CANCELLED';
        if (code === 'HOLD' || code.includes('HOLD')) return 'ON_HOLD';
        
        return null;
    }
}
