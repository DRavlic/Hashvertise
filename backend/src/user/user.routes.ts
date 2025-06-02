import { Router } from "express";
import { validateUser } from "./user.controller";
import { validateRequest } from "../common/common.middleware";
import { validateUserSchema } from "./user.schema";

const router = Router();

/**
 * @route POST /api/user/validate
 * @description Validate user info and create user if needed
 * @access Public
 */
router.post("/validate", validateRequest(validateUserSchema), validateUser);

export default router;
