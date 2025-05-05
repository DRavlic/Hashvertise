import express from "express";
import {
  setupHederaTopicListener,
  checkTopicStatus,
  getTopicMessages,
  deactivateTopicListener,
  verifyCampaignAndCreate,
  getCampaigns,
} from "./topic.controller";
import { validate } from "./topic.middleware";
import {
  topicListenSchema,
  topicStatusSchema,
  topicMessagesSchema,
  topicDeactivateSchema,
  campaignVerifySchema,
  campaignsListSchema,
} from "./topic.schema";

const router = express.Router();

/**
 * @route POST /api/topic/listen
 * @description Set up a topic listener for a Hedera topic
 * @access Public
 */
router.post("/listen", validate(topicListenSchema), setupHederaTopicListener);

/**
 * @route GET /api/topic/status/:topicId
 * @description Check the status of a topic listener
 * @access Public
 */
router.get("/status/:topicId", validate(topicStatusSchema), checkTopicStatus);

/**
 * @route GET /api/topic/messages/:topicId
 * @description Get all messages for a specific topic
 * @access Public
 */
router.get(
  "/messages/:topicId",
  validate(topicMessagesSchema),
  getTopicMessages
);

/**
 * @route POST /api/topic/deactivate/:topicId
 * @description Deactivate a topic listener
 * @access Public
 */
router.post(
  "/deactivate/:topicId",
  validate(topicDeactivateSchema),
  deactivateTopicListener
);

/**
 * @route POST /api/topic/campaign/verify
 * @description Verify campaign signature and create a campaign
 * @access Public
 */
router.post(
  "/campaign/verify",
  validate(campaignVerifySchema),
  verifyCampaignAndCreate
);

/**
 * @route GET /api/topic/campaigns
 * @description Get all campaigns with pagination
 * @access Public
 */
router.get("/campaigns", validate(campaignsListSchema), getCampaigns);

export default router;
