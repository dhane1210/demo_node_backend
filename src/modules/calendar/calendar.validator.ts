import { z } from 'zod';

export const createCalendarEventSchema = z.object({
    shipment_id: z.string().uuid().optional(),
    event_type: z.enum(['ETD', 'ETA', 'CUTOFF', 'DELIVERY_DEADLINE', 'OTHER']),
    title: z.string().min(1, 'Title is required'),
    description: z.string().optional(),
    event_date: z.string().datetime(),
    all_day: z.number().int().min(0).max(1).default(1),
    color: z.string().optional(),
});

export const updateCalendarEventSchema = z.object({
    event_type: z.enum(['ETD', 'ETA', 'CUTOFF', 'DELIVERY_DEADLINE', 'OTHER']).optional(),
    title: z.string().min(1).optional(),
    description: z.string().optional(),
    event_date: z.string().datetime().optional(),
    all_day: z.number().int().min(0).max(1).optional(),
    color: z.string().optional(),
});
