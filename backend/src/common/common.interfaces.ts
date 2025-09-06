/**
 * Health check response interface
 */
export interface HealthCheckResponse {
    success: boolean;
    data?: {
        status: string;
        timestamp: string;
        service: string;
        version: string;
        uptime: number;
        memory: {
            used: number;
            total: number;
        };
        nodeVersion: string;
    };
    error?: string;
}
