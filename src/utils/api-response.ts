import { Response } from 'express';

export interface ApiResponse<T = unknown> {
    success: boolean;
    data?: T;
    error?: string;
    message?: string;
    meta?: {
        page?: number;
        limit?: number;
        total?: number;
        totalPages?: number;
    };
}

export class ApiResponseHelper {
    static success<T>(res: Response, data: T, statusCode: number = 200, meta?: ApiResponse['meta']): Response {
        const response: ApiResponse<T> = {
            success: true,
            data,
            ...(meta && { meta }),
        };
        return res.status(statusCode).json(response);
    }

    static created<T>(res: Response, data: T): Response {
        return ApiResponseHelper.success(res, data, 201);
    }

    static error(res: Response, message: string, statusCode: number = 400): Response {
        const response: ApiResponse = {
            success: false,
            error: message,
        };
        return res.status(statusCode).json(response);
    }

    static notFound(res: Response, resource: string = 'Resource'): Response {
        return ApiResponseHelper.error(res, `${resource} not found`, 404);
    }

    static serverError(res: Response, message: string = 'Internal server error'): Response {
        return ApiResponseHelper.error(res, message, 500);
    }

    static paginated<T>(
        res: Response,
        data: T[],
        total: number,
        page: number,
        limit: number
    ): Response {
        return ApiResponseHelper.success(res, data, 200, {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
        });
    }
}
