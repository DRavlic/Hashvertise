import express from "express";
import {
  setupHederaTopicListener,
  checkTopicStatus,
  getTopicMessages,
  deactivateTopicListener,
} from "./topic.controller";
import { validate } from "./topic.middleware";
import {
  topicListenSchema,
  topicStatusSchema,
  topicMessagesSchema,
  topicDeactivateSchema,
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

export default router;
