import { BaseRow } from '../../types';

export interface CustomerRow extends BaseRow {
    name: string;
    email: string | null;
    company: string | null;
    phone: string | null;
    address: string | null;
    contact_person: string | null;
    notes: string | null;
}

export interface CreateCustomerInput {
    name: string;
    email?: string;
    company?: string;
    phone?: string;
    address?: string;
    contact_person?: string;
    notes?: string;
}

export interface UpdateCustomerInput extends Partial<CreateCustomerInput> { }
