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

// POST /api/topic/listen - Set up a topic listener
router.post("/listen", validate(topicListenSchema), setupHederaTopicListener);

// GET /api/topic/status/:topicId - Check topic listener status
router.get("/status/:topicId", validate(topicStatusSchema), checkTopicStatus);

// GET /api/topic/messages/:topicId - Get all messages for a topic
router.get(
  "/messages/:topicId",
  validate(topicMessagesSchema),
  getTopicMessages
);

// POST /api/topic/deactivate/:topicId - Deactivate a topic listener
router.post(
  "/deactivate/:topicId",
  validate(topicDeactivateSchema),
  deactivateTopicListener
);

export default router;
