import { Request, Response } from 'express';
import { ApiResponseHelper } from '../../utils/api-response';
import { config } from '../../config';

export class AuthController {
    static async login(req: Request, res: Response) {
        try {
            const { username, password } = req.body;

            if (!username || !password) {
                return ApiResponseHelper.error(res, 'Username and password are required', 400);
            }

            // Basic comparison
            if (
                username === config.auth.adminUsername &&
                password === config.auth.adminPassword
            ) {
                // Return a simple mock token or JWT if preferred.
                // Since this is a simple local app, we can just return a true token string.
                const token = 'login_authenticated_eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9';
                return ApiResponseHelper.success(res, { token });
            }

            return ApiResponseHelper.error(res, 'Invalid credentials', 401);
        } catch (error) {
            return ApiResponseHelper.error(res, 'Failed to authenticate', 500);
        }
    }
}
