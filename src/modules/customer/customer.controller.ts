import { Request, Response, NextFunction } from 'express';
import { CustomerService } from './customer.service';
import { ApiResponseHelper } from '../../utils/api-response';

export class CustomerController {
    private service: CustomerService;

    constructor() {
        this.service = new CustomerService();
    }

    getAllCustomers = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const page = req.query.page ? parseInt(String(req.query.page)) : 1;
            const limit = req.query.limit ? parseInt(String(req.query.limit)) : 20;
            const result = this.service.getAllCustomers(page, limit);
            ApiResponseHelper.success(res, result);
        } catch (error) {
            next(error);
        }
    };

    getCustomerById = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const customer = this.service.getCustomerById(req.params.id as string);
            if (!customer) {
                return ApiResponseHelper.error(res, 'Customer not found', 404);
            }
            ApiResponseHelper.success(res, customer);
        } catch (error) {
            next(error);
        }
    };

    createCustomer = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const customer = this.service.createCustomer(req.body);
            ApiResponseHelper.success(res, customer, 201);
        } catch (error) {
            next(error);
        }
    };

    updateCustomer = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const customer = this.service.updateCustomer(req.params.id as string, req.body);
            ApiResponseHelper.success(res, customer);
        } catch (error: any) {
            if (error.message && error.message.includes('not found')) {
                return ApiResponseHelper.error(res, error.message, 404);
            }
            next(error);
        }
    };

    deleteCustomer = async (req: Request, res: Response, next: NextFunction) => {
        try {
            this.service.deleteCustomer(req.params.id as string);
            ApiResponseHelper.success(res, { message: 'Customer deleted successfully' });
        } catch (error: any) {
            if (error.message && error.message.includes('not found')) {
                return ApiResponseHelper.error(res, error.message, 404);
            }
            next(error);
        }
    };
}
