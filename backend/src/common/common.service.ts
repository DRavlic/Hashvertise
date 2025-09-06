import { HealthCheckResponse } from "./common.interfaces";
import logger from "./common.instances";

/**
 * Get health check information for the service
 *
 * @returns {Promise<HealthCheckResponse>} Health check result
 */
export const getHealthStatus = async (): Promise<HealthCheckResponse> => {
    try {
        const healthData = {
            status: "healthy",
            timestamp: new Date().toISOString(),
            service: "hashvertise-backend",
            version: "1.0.0",
            uptime: process.uptime(),
            memory: {
                used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
                total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
            },
            nodeVersion: process.version,
        };

        logger.info("Health check performed successfully");

        return {
            success: true,
            data: healthData,
        };
    } catch (error: any) {
        logger.error("Error in getHealthStatus service:", error);
        return {
            success: false,
            error: "Health check failed",
        };
    }
};
