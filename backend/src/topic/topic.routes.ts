import express from "express";
import {
  setupHederaTopicListener,
  checkTopicStatus,
  getTopicMessages,
  deactivateTopicListener,
  verifyCampaignAndCreate,
  getCampaigns,
  getCampaign,
} from "./topic.controller";
import { validateRequest } from "../common/common.middleware";
import {
  topicListenSchema,
  topicStatusSchema,
  topicMessagesSchema,
  topicDeactivateSchema,
  campaignVerifySchema,
  campaignsListSchema,
  campaignGetSchema,
} from "./topic.schema";

const router = express.Router();

/**
 * @route POST /api/topic/listen
 * @description Set up a topic listener for a Hedera topic
 * @access Public
 */
router.post(
  "/listen",
  validateRequest(topicListenSchema),
  setupHederaTopicListener
);

/**
 * @route GET /api/topic/status/:topicId
 * @description Check the status of a topic listener
 * @access Public
 */
router.get(
  "/status/:topicId",
  validateRequest(topicStatusSchema),
  checkTopicStatus
);

/**
 * @route GET /api/topic/messages/:topicId
 * @description Get all messages for a specific topic
 * @access Public
 */
router.get(
  "/messages/:topicId",
  validateRequest(topicMessagesSchema),
  getTopicMessages
);

/**
 * @route POST /api/topic/deactivate/:topicId
 * @description Deactivate a topic listener
 * @access Public
 */
router.post(
  "/deactivate/:topicId",
  validateRequest(topicDeactivateSchema),
  deactivateTopicListener
);

/**
 * @route POST /api/topic/campaign/verify
 * @description Verify campaign signature and create a campaign
 * @access Public
 */
router.post(
  "/campaign/verify",
  validateRequest(campaignVerifySchema),
  verifyCampaignAndCreate
);

/**
 * @route GET /api/topic/campaigns
 * @description Get all campaigns with pagination
 * @access Public
 */
router.get("/campaigns", validateRequest(campaignsListSchema), getCampaigns);

/**
 * @route GET /api/topic/campaign/:topicId
 * @description Get a campaign by topic ID
 * @access Public
 */
router.get(
  "/campaign/:topicId",
  validateRequest(campaignGetSchema),
  getCampaign
);

export default router;
