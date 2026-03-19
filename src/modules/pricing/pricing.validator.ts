import { z } from 'zod';

export const createJobSchema = z.object({
    customer_id: z.string().optional(),
    shipper: z.string().optional(),
    consignee: z.string().optional(),
    commodity: z.string().optional(),
    package_contains: z.string().optional(),
    package_type: z.string().optional(),
    date_needed: z.string().optional(),
    weight: z.number().optional(),
    cbm: z.number().optional(),
    incoterm: z.string().optional(),
    pickup: z.string().optional(),
    delivery: z.string().optional(),
    additional_notes: z.string().optional(),
});

export const updateJobSchema = z.object({
    shipper: z.string().optional(),
    consignee: z.string().optional(),
    commodity: z.string().optional(),
    package_contains: z.string().optional(),
    package_type: z.string().optional(),
    date_needed: z.string().optional(),
    weight: z.number().optional(),
    cbm: z.number().optional(),
    incoterm: z.string().optional(),
    pickup: z.string().optional(),
    delivery: z.string().optional(),
    additional_notes: z.string().optional(),
    status: z.enum(['PENDING', 'AGENT_RATE_RECEIVED', 'WAITING_ON_AGENT', 'COMPLETED']).optional(),
});

export const pricingInputSchema = z.object({
    agent_rate: z.number().min(0, 'Agent rate must be positive'),
    clearance_charges: z.number().min(0).default(0),
    delivery_order: z.number().min(0).default(0),
    vat: z.number().min(0).default(0),
    markup_percent: z.number().min(0).max(100).default(0),
    currency: z.string().default('USD'),
    notes: z.string().optional(),
});
