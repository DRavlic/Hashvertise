import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import {
  setupHederaTopicListener as setupHederaTopicListenerService,
  getTopicStatus,
  getTopicMessages as getTopicMessagesService,
  deactivateTopicListener as deactivateTopicListenerService,
} from "./topic.service";
import logger from "../common/common.instances";
import { DEFAULT_TOPIC_MESSAGES_LIMIT } from "./topic.constants";

/**
 * Set up a topic listener
 */
export const setupHederaTopicListener = async (req: Request, res: Response) => {
  try {
    const { topicId } = req.body;
    const hederaClient = req.app.locals.hederaClient;

    const result = await setupHederaTopicListenerService(topicId, hederaClient);

    if (!result.success) {
      if (result.error === "Already listening to this topic") {
        return res.status(StatusCodes.CONFLICT).json({
          error: result.error,
          topicId,
        });
      }

      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        error: result.error,
        details: result.details,
      });
    }

    return res.status(StatusCodes.OK).json({
      success: true,
      message: result.message,
    });
  } catch (error: any) {
    logger.error("Error in setupHederaTopicListener controller:", error);

    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      error: "Internal server error",
      details: error.message || String(error),
    });
  }
};

/**
 * Check topic listener status
 */
export const checkTopicStatus = async (req: Request, res: Response) => {
  try {
    const { topicId } = req.params;
    const status = await getTopicStatus(topicId);

    return res.status(StatusCodes.OK).json(status);
  } catch (error: any) {
    logger.error("Error in checkTopicStatus controller:", error);

    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      error: "Internal server error",
      details: error.message || String(error),
    });
  }
};

/**
 * Get messages for a specific topic
 */
export const getTopicMessages = async (req: Request, res: Response) => {
  try {
    const { topicId } = req.params;
    const limit =
      (req.query.limit as unknown as number) || DEFAULT_TOPIC_MESSAGES_LIMIT;

    const result = await getTopicMessagesService(topicId, limit);

    if (!result.success) {
      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        error: result.error,
        details: result.details,
      });
    }

    return res.status(StatusCodes.OK).json({
      success: true,
      messages: result.messages,
    });
  } catch (error: any) {
    logger.error("Error in getTopicMessages controller:", error);

    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      error: "Internal server error",
      details: error.message || String(error),
    });
  }
};

/**
 * Deactivate a topic listener
 */
export const deactivateTopicListener = async (req: Request, res: Response) => {
  try {
    const { topicId } = req.params;

    await deactivateTopicListenerService(topicId);

    return res.status(StatusCodes.OK).json({
      success: true,
      message: `Topic listener for ${topicId} has been deactivated`,
    });
  } catch (error: any) {
    logger.error("Error in deactivateTopicListener controller:", error);

    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      error: "Internal server error",
      details: error.message || String(error),
    });
  }
};
