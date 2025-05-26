import express from "express";
import { getUserTweets, getUserInfo, distributeRewards } from "./x.controller";
import { validateRequest } from "../common/common.middleware";
import {
  getUserTweetsSchema,
  getUserInfoSchema,
  distributeRewardSchema,
} from "./x.schema";

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

/**
 * @route GET /api/x/user/:userName
 * @description Get user info from Twitter
 * @access Public
 */
router.get("/user/:userName", validateRequest(getUserInfoSchema), getUserInfo);

/**
 * @route POST /api/x/distribute-reward/:topicId
 * @description Distribute rewards for a campaign
 * @access Public
 */
router.post(
  "/distribute-reward/:topicId",
  validateRequest(distributeRewardSchema),
  distributeRewards
);

export default router;
