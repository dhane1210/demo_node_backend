import { z } from 'zod';

export const createDocumentSchema = z.object({
    shipment_id: z.string().uuid(),
    name: z.string().min(1),
    type: z.string().optional(),
    url: z.string().url(),
    size: z.number().optional(),
    uploaded_by: z.string().optional(),
});
