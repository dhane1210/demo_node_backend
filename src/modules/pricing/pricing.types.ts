export interface JobRow {
    id: string;
    customer_id: string | null;
    shipper: string | null;
    consignee: string | null;
    commodity: string | null;
    package_contains: string | null;
    package_type: string | null;
    date_needed: string | null;
    weight: number | null;
    cbm: number | null;
    incoterm: string | null;
    pickup: string | null;
    delivery: string | null;
    additional_notes: string | null;
    status: string;
    created_at: string;
    updated_at: string;
}

export interface PricingRow {
    id: string;
    job_id: string;
    agent_rate: number | null;
    clearance_charges: number;
    delivery_order: number;
    vat: number;
    markup_percent: number;
    total_cost: number;
    selling_price: number;
    profit_value: number;
    profit_margin_percent: number;
    currency: string;
    notes: string | null;
    created_at: string;
    updated_at: string;
}

export interface PricingInput {
    agent_rate: number;
    clearance_charges?: number;
    delivery_order?: number;
    vat?: number;
    markup_percent?: number;
    currency?: string;
    notes?: string;
}

export interface PricingCalculation {
    total_cost: number;
    selling_price: number;
    profit_value: number;
    profit_margin_percent: number;
}
