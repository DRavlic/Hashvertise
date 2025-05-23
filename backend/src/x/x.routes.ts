import express from "express";
import { getUserTweets } from "./x.controller";
import { validateRequest } from "../common/common.middleware";
import { getUserTweetsSchema } from "./x.schema";

const router = express.Router();

/**
 * @route GET /api/x/tweets/:userName
 * @description Get last tweets of a Twitter user
 * @access Public
 */
router.get(
  "/tweets/:userName",
  validateRequest(getUserTweetsSchema),
  getUserTweets
);

export default router;
