import { PricingRepository } from './pricing.repository';
import { JobRow, PricingInput } from './pricing.types';

export class PricingService {
    private repository: PricingRepository;
    constructor() { this.repository = new PricingRepository(); }

    // ─── Jobs ─────────────────────────────────────────────

    async getJobs(status?: string, page: number = 1, limit: number = 20) {
        return this.repository.findAllJobs(status, page, limit);
    }

    async getJobDetail(id: string) {
        const job = this.repository.findJobById(id);
        if (!job) return null;
        const pricing = this.repository.findPricingByJobId(id);
        return { ...job, pricing };
    }

    async createJob(data: Partial<JobRow>) {
        return this.repository.createJob(data);
    }

    async updateJob(id: string, data: Partial<JobRow>) {
        return this.repository.updateJob(id, data);
    }

    // ─── Pricing / Profit Calculator ──────────────────────

    /**
     * Calculate and store pricing for a job.
     * Automatic Profit Calculator:
     *   total_cost = agent_rate + clearance_charges + delivery_order + vat
     *   selling_price = total_cost * (1 + markup_percent / 100)
     *   profit_value = selling_price - total_cost
     *   profit_margin_percent = (profit_value / selling_price) * 100
     */
    async calculatePricing(jobId: string, input: PricingInput) {
        const job = this.repository.findJobById(jobId);
        if (!job) return null;

        const agentRate = input.agent_rate;
        const clearanceCharges = input.clearance_charges || 0;
        const deliveryOrder = input.delivery_order || 0;
        const vat = input.vat || 0;
        const markupPercent = input.markup_percent || 0;

        const totalCost = agentRate + clearanceCharges + deliveryOrder + vat;
        const sellingPrice = totalCost * (1 + markupPercent / 100);
        const profitValue = sellingPrice - totalCost;
        const profitMarginPercent = sellingPrice > 0 ? (profitValue / sellingPrice) * 100 : 0;

        const pricing = this.repository.upsertPricing({
            job_id: jobId,
            agent_rate: agentRate,
            clearance_charges: clearanceCharges,
            delivery_order: deliveryOrder,
            vat: vat,
            markup_percent: markupPercent,
            total_cost: Math.round(totalCost * 100) / 100,
            selling_price: Math.round(sellingPrice * 100) / 100,
            profit_value: Math.round(profitValue * 100) / 100,
            profit_margin_percent: Math.round(profitMarginPercent * 100) / 100,
            currency: input.currency || 'USD',
            notes: input.notes || null,
        });

        // Update job status to agent rate received
        this.repository.updateJob(jobId, { status: 'AGENT_RATE_RECEIVED' });

        return pricing;
    }

    async getPricing(jobId: string) {
        return this.repository.findPricingByJobId(jobId);
    }
}
