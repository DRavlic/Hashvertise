import { Request, Response, NextFunction } from "express";
import { StatusCodes } from "http-status-codes";
import logger from "./common.instances";

/**
 * Global error handling middleware
 *
 * @param {any} err - Error object thrown by the application
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @param {NextFunction} next - Express next function
 * @returns {Response} HTTP response with error information
 */
export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // Log error with request context for better debugging
  logger.error({
    error: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
    requestId: req.headers["x-request-id"] || "unknown",
  });

  // Don't expose internal error details in production
  const isProduction = process.env.NODE_ENV === "production";

  // Handle different types of errors with appropriate status codes
  if (err.name === "ValidationError") {
    return res.status(StatusCodes.BAD_REQUEST).json({
      error: "Validation Error",
      details: isProduction ? "Invalid request data" : err.message,
    });
  }

  if (
    err.name === "UnauthorizedError" ||
    err.message.includes("unauthorized")
  ) {
    return res.status(StatusCodes.UNAUTHORIZED).json({
      error: "Authentication Error",
      details: "Invalid or expired token",
    });
  }

  if (err.name === "ForbiddenError") {
    return res.status(StatusCodes.FORBIDDEN).json({
      error: "Forbidden",
      details: "You do not have permission to access this resource",
    });
  }

  if (err.name === "NotFoundError" || err.message.includes("not found")) {
    return res.status(StatusCodes.NOT_FOUND).json({
      error: "Not Found",
      details: "The requested resource was not found",
    });
  }

  // Default server error
  res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
    error: "Internal Server Error",
    // Only include error message details in non-production environments
    ...(isProduction ? {} : { message: err.message }),
  });
};
