import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';
import { ApiResponseHelper } from '../utils/api-response';

type RequestField = 'body' | 'query' | 'params';

export function validateRequest(schema: ZodSchema, field: RequestField = 'body') {
    return (req: Request, res: Response, next: NextFunction): void => {
        try {
            const parsed = schema.parse(req[field]);
            req[field] = parsed;
            next();
        } catch (error) {
            if (error instanceof ZodError) {
                const messages = error.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join(', ');
                ApiResponseHelper.error(res, `Validation error: ${messages}`, 422);
                return;
            }
            next(error);
        }
    };
}
