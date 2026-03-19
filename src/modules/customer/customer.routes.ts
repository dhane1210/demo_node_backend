import { Router } from 'express';
import { CustomerController } from './customer.controller';

const router = Router();
const controller = new CustomerController();

router.get('/', controller.getAllCustomers);
router.get('/:id', controller.getCustomerById);
router.post('/', controller.createCustomer);
router.put('/:id', controller.updateCustomer);
router.delete('/:id', controller.deleteCustomer);

export default router;
