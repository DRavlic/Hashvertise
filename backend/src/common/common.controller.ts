import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { getHealthStatus } from "./common.service";
import logger from "./common.instances";

/**
 * Health check endpoint for monitoring and Railway
 *
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @returns {Promise<Response>} HTTP response with health status
 */
export const healthCheck = async (
    req: Request,
    res: Response
): Promise<Response> => {
    try {
        const result = await getHealthStatus();

        if (!result.success) {
            return res.status(StatusCodes.SERVICE_UNAVAILABLE).json({
                success: false,
                error: result.error,
            });
        }

        return res.status(StatusCodes.OK).json({
            success: true,
            ...result.data,
        });
    } catch (error: any) {
        logger.error("Error in healthCheck controller:", error);
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
            success: false,
            error: "Internal server error",
        });
    }
};
