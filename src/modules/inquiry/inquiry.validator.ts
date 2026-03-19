import { z } from 'zod';

export const createInquirySchema = z.object({
    customer_name: z.string().min(1, 'Customer name is required'),
    customer_email: z.string().email('Invalid email').optional(),
    message: z.string().optional(),
    shipment_id: z.string().uuid('Invalid shipment ID').optional(),
});

export const respondInquirySchema = z.object({
    admin_response: z.string().min(1, 'Response cannot be empty'),
    status: z.enum(['NEW', 'REPLIED', 'CLOSED']).default('REPLIED'),
});

export const linkInquirySchema = z.object({
    shipment_id: z.string().uuid('Invalid shipment ID'),
});
