import express from "express";
import { setupHederaTopicListener, checkTopicStatus } from "./topic.controller";
import { validate } from "./topic.middleware";
import { topicListenSchema, topicStatusSchema } from "./topic.schema";

const router = express.Router();

// POST /api/topic/listen - Set up a topic listener
router.post("/listen", validate(topicListenSchema), setupHederaTopicListener);

// GET /api/topic/status/:topicId - Check topic listener status
router.get("/status/:topicId", validate(topicStatusSchema), checkTopicStatus);

export default router;
