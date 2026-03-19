import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';
import { ApiResponseHelper } from '../utils/api-response';

export function errorHandler(err: Error, _req: Request, res: Response, _next: NextFunction): void {
    logger.error('Unhandled error:', err);

    if (res.headersSent) {
        return;
    }

    const statusCode = 'statusCode' in err ? (err as any).statusCode : 500;
    const message = err.message || 'Internal server error';

    ApiResponseHelper.error(res, message, statusCode);
}
