import { Router } from "express";
import {
  getHashvertiseConfig,
  updateHashvertiseConfig,
} from "./hashvertise.controller";
import { validateRequest } from "../common/common.middleware";
import { getConfigSchema, updateConfigSchema } from "./hashvertise.schema";

const router = Router();

// GET /api/hashvertise/config - Get Hashvertise configuration
router.get("/config", validateRequest(getConfigSchema), getHashvertiseConfig);

// PUT /api/hashvertise/config - Update Hashvertise configuration (TODO: admin only)
router.put(
  "/config",
  validateRequest(updateConfigSchema),
  updateHashvertiseConfig
);

export default router;
