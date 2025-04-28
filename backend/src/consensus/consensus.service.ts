import { Client, TopicId } from "@hashvertise/crypto";
import logger from "../common/common.instances";
import { submitMessageToTopic } from "../common/common.hedera";
import { ERROR_MESSAGES } from "./consensus.constants";
import { SubmitMessageRequest } from "./consensus.interfaces";

/**
 * Submit a consensus message to the Hedera network
 *
 * @param {Client} client - Hedera client instance
 * @param {SubmitMessageRequest} request - Message submission request details
 * @returns {Promise<{success: boolean, topicId?: string, error?: string, details?: string}>}
 *          Object containing success status and topic ID or error details
 */
export const submitMessage = async (
  client: Client,
  request: SubmitMessageRequest
) => {
  try {
    const { message, topicId } = request;

    // Convert topicId to TopicId object if provided
    let topicIdObj: TopicId | undefined;
    if (topicId) {
      topicIdObj = TopicId.fromString(topicId);
    }

    // Use common service to submit the message
    const newTopicId = await submitMessageToTopic(client, message, topicIdObj);

    if (!newTopicId) {
      return {
        success: false,
        error: ERROR_MESSAGES.SUBMIT_FAILED,
      };
    }

    // Return success response
    return {
      success: true,
      topicId: newTopicId.toString(),
    };
  } catch (error: any) {
    logger.error(`Error in consensus service: ${error.message}`);

    // Return error response
    return {
      success: false,
      error: ERROR_MESSAGES.SUBMIT_FAILED,
      details: error.message || String(error),
    };
  }
};
