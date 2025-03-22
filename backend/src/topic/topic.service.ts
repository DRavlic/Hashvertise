import { Client, TopicId, setupTopicListener } from "@hashvertise/crypto";
import { TopicListenerModel, TopicMessageModel } from "./topic.model";
import logger from "../common/common.instances";

interface TopicStatusResponse {
  topicId: string;
  isActive: boolean;
}

interface TopicListenResponse {
  success: boolean;
  message?: string;
  error?: string;
  details?: string;
}

/**
 * Handles incoming topic messages by saving them to the database
 * @param topicId The ID of the topic receiving the message
 * @param message The message content
 * @param timestamp The consensus timestamp
 */
const handleTopicMessage = async (
  topicId: string,
  message: string,
  timestamp: Date
): Promise<void> => {
  try {
    await TopicMessageModel.create({
      topicId,
      message,
      consensusTimestamp: timestamp,
    });
    logger.info(`Saved new message for topic ${topicId}`);
  } catch (error: any) {
    logger.error(`Error saving message for topic ${topicId}: ${error.message}`);
  }
};

/**
 * Setup a listener for a Hedera topic
 */
export const setupHederaTopicListener = async (
  topicId: string,
  client: Client
): Promise<TopicListenResponse> => {
  try {
    // Check if we're already listening to this topic
    const existingListener = await TopicListenerModel.findOne({ topicId });
    if (existingListener?.isActive) {
      return {
        success: false,
        error: "Already listening to this topic",
      };
    }

    // Create or update the topic listener in database
    await TopicListenerModel.findOneAndUpdate(
      { topicId },
      { topicId, isActive: true },
      { upsert: true, new: true }
    );

    // Set up the Hedera topic listener with callback to save messages
    await setupTopicListener(
      client,
      TopicId.fromString(topicId),
      handleTopicMessage
    );
    logger.info(`Started listening to topic: ${topicId}`);

    return {
      success: true,
      message: `Started listening to topic: ${topicId}`,
    };
  } catch (error: any) {
    logger.error(`Error in setupHederaTopicListener: ${error.message}`);

    // Use the existing function to handle deactivation - don't duplicate logic
    await deactivateTopicListener(topicId).catch((deactivateError) => {
      logger.warn(
        `Failed to deactivate topic ${topicId}: ${deactivateError.message}`
      );
    });

    return {
      success: false,
      error: "Failed to set up topic listener",
      details: error.message || String(error),
    };
  }
};

/**
 * Check the status of a topic listener
 */
export const getTopicStatus = async (
  topicId: string
): Promise<TopicStatusResponse> => {
  try {
    const listener = await TopicListenerModel.findOne({ topicId });

    return {
      topicId,
      isActive: listener ? listener.isActive : false,
    };
  } catch (error) {
    logger.error(`Error checking status for topic ${topicId}:`, error);
    throw error;
  }
};

/**
 * Get messages for a specific topic
 */
export const getTopicMessages = async (topicId: string, limit = 50) => {
  try {
    const messages = await TopicMessageModel.find({ topicId })
      .sort({ consensusTimestamp: -1 })
      .limit(limit);

    return {
      success: true,
      messages,
    };
  } catch (error: any) {
    logger.error(
      `Error retrieving messages for topic ${topicId}: ${error.message}`
    );

    return {
      success: false,
      error: "Failed to retrieve topic messages",
      details: error.message || String(error),
    };
  }
};

/**
 * Mark a topic listener as inactive
 */
export const deactivateTopicListener = async (
  topicId: string
): Promise<void> => {
  try {
    await TopicListenerModel.findOneAndUpdate({ topicId }, { isActive: false });
    logger.info(`Marked topic ${topicId} as inactive`);
  } catch (error) {
    logger.error(`Error deactivating topic ${topicId}:`, error);
    throw error;
  }
};
