import axios, { AxiosInstance, AxiosError } from 'axios';
import { config } from '../../config';
import { logger } from '../../utils/logger';
import { SinayShipmentResponse, SinayShipmentParams } from './sinay.types';

export class SinayClient {
    private client: AxiosInstance;
    private maxRetries: number = 3;
    private retryDelayMs: number = 1000;

    constructor() {
        this.client = axios.create({
            baseURL: config.sinay.baseUrl,
            timeout: 30000,
            headers: {
                'API_KEY': config.sinay.apiKey,
                'Content-Type': 'application/json',
            },
        });

        // Response interceptor for logging
        this.client.interceptors.response.use(
            (response) => {
                logger.debug(`Sinay API response: ${response.status} ${response.config.url}`);
                return response;
            },
            (error: AxiosError) => {
                logger.error(`Sinay API error: ${error.response?.status} ${error.config?.url}`, {
                    data: error.response?.data,
                });
                return Promise.reject(error);
            }
        );
    }

    /**
     * Get shipment detail from Sinay API.
     * Supports tracking by Container (CT), Bill of Lading (BL), or Booking (BK) number.
     */
    async getShipmentDetail(params: SinayShipmentParams): Promise<SinayShipmentResponse> {
        const { shipmentNumber, sealine, route = true, ais = true } = params;

        const queryParams: Record<string, string | boolean> = {
            shipmentNumber,
            shipmentType: 'CT',
            route,
            ais,
        };
        if (sealine) {
            queryParams.sealine = sealine;
        }

        return this.withRetry(async () => {
            const response = await this.client.get<SinayShipmentResponse>('/shipment', {
                params: queryParams,
            });
            return response.data;
        });
    }

    /**
     * Retry wrapper with exponential backoff.
     */
    private async withRetry<T>(fn: () => Promise<T>, attempt: number = 1): Promise<T> {
        try {
            return await fn();
        } catch (error) {
            if (attempt >= this.maxRetries) {
                throw error;
            }

            const isRetryable =
                error instanceof AxiosError &&
                (error.response?.status === 429 ||
                    error.response?.status === 502 ||
                    error.response?.status === 503 ||
                    !error.response);

            if (!isRetryable) {
                throw error;
            }

            const delay = this.retryDelayMs * Math.pow(2, attempt - 1);
            logger.warn(`Sinay API retry attempt ${attempt}/${this.maxRetries} in ${delay}ms`);
            await new Promise((resolve) => setTimeout(resolve, delay));

            return this.withRetry(fn, attempt + 1);
        }
    }
}

// Singleton instance
let sinayClient: SinayClient | null = null;

export function getSinayClient(): SinayClient {
    if (!sinayClient) {
        sinayClient = new SinayClient();
    }
    return sinayClient;
}
