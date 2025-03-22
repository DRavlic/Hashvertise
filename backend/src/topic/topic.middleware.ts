import { Request, Response, NextFunction } from "express";
import { AnyZodObject } from "zod";
import logger from "../common/common.instances";

// Middleware for validating requests based on Zod schemas
export const validate =
  (schema: AnyZodObject) =>
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
