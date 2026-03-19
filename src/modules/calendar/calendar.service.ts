import { CalendarRepository } from './calendar.repository';
import { CalendarEventRow } from './calendar.types';

export class CalendarService {
    private repository: CalendarRepository;
    constructor() { this.repository = new CalendarRepository(); }

    async getEvents(startDate?: string, endDate?: string, eventType?: string) {
        return this.repository.findAll(startDate, endDate, eventType);
    }

    async createEvent(data: Partial<CalendarEventRow>) {
        return this.repository.create(data);
    }

    async updateEvent(id: string, data: Partial<CalendarEventRow>) {
        return this.repository.update(id, data);
    }

    async deleteEvent(id: string) { return this.repository.delete(id); }

    async syncFromShipments() {
        const count = this.repository.syncFromShipments();
        return { synced: count };
    }
}
