import { Router } from "express";
import { healthCheck } from "./common.controller";

const router = Router();

/**
 * @route GET /api/health
 * @description Health check endpoint for Railway and monitoring
 * @access Public
 */
router.get("/health", healthCheck);

export default router;