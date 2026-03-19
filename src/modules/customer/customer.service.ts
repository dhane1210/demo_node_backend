import { CustomerRepository } from './customer.repository';
import { CreateCustomerInput, UpdateCustomerInput, CustomerRow } from './customer.types';

export class CustomerService {
    private repository: CustomerRepository;

    constructor() {
        this.repository = new CustomerRepository();
    }

    getAllCustomers(page: number = 1, limit: number = 20) {
        return this.repository.findAll(page, limit);
    }

    getCustomerById(id: string) {
        return this.repository.findById(id);
    }

    createCustomer(input: CreateCustomerInput) {
        if (!input.name) {
            throw new Error('Customer name is required');
        }
        return this.repository.create(input);
    }

    updateCustomer(id: string, input: UpdateCustomerInput) {
        const updated = this.repository.update(id, input);
        if (!updated) {
            throw new Error(`Customer with ID ${id} not found`);
        }
        return updated;
    }

    deleteCustomer(id: string) {
        const deleted = this.repository.delete(id);
        if (!deleted) {
            throw new Error(`Customer with ID ${id} not found`);
        }
        return true;
    }
}
