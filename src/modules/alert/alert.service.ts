import { AlertRepository } from './alert.repository';
import { AlertRow } from './alert.types';

export class AlertService {
    private repository: AlertRepository;
    constructor() { this.repository = new AlertRepository(); }

    async getDashboard(status?: string, severity?: string, page: number = 1, limit: number = 20) {
        return this.repository.findAll(status, severity, page, limit);
    }

    async getAlertDetail(id: string) { return this.repository.findById(id); }

    async createAlert(data: Partial<AlertRow>) { return this.repository.create(data); }

    async acknowledgeAlert(id: string, actionTaken?: string) {
        return this.repository.update(id, {
            status: 'ACKNOWLEDGED',
            action_taken: actionTaken || null,
        });
    }

    async resolveAlert(id: string, resolvedBy: string, actionTaken?: string) {
        return this.repository.update(id, {
            status: 'RESOLVED',
            resolved_at: new Date().toISOString(),
            resolved_by: resolvedBy,
            action_taken: actionTaken || null,
        });
    }

    async updateAlert(id: string, updates: Partial<AlertRow>) {
        return this.repository.update(id, updates);
    }
}
