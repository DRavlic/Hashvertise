import { Request, Response, NextFunction } from "express";
import { AnyZodObject } from "zod";
import logger from "../common/common.instances";

/**
 * Middleware factory for validating requests against Zod schemas
 *
 * @param {AnyZodObject} schema - Zod schema for request validation
 * @returns {Function} Middleware function that validates request against schema
 */
export const validate =
  (schema: AnyZodObject) =>
  /**
   * Validates request body, query, and params against the provided schema
   *
   * @param {Request} req - Express request object
   * @param {Response} res - Express response object
   * @param {NextFunction} next - Express next function
   * @returns {void | Response} Continues to next middleware or returns validation error
   */
  (req: Request, res: Response, next: NextFunction) => {
    try {
      schema.parse({
        body: req.body,
        query: req.query,
        params: req.params,
      });
      next();
    } catch (error: any) {
      logger.error("Request validation error:", error);
      return res.status(400).json({
        error: "Validation failed",
        details: error.errors,
      });
    }
  };
