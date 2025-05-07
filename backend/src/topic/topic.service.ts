import { Client, TopicId, SubscriptionHandle } from "@hashgraph/sdk";
import {
  TopicListenerModel,
  TopicMessageModel,
  CampaignModel,
  Campaign,
} from "./topic.model";
import logger from "../common/common.instances";
import { DEFAULT_TOPIC_MESSAGES_LIMIT } from "./topic.constants";
import {
  TopicListenResponse,
  TopicStatusResponse,
  ParsedCampaignData,
  ParsedTopicMessageData,
} from "./topic.interfaces";
import { setupTopicListener } from "../common/common.hedera";
import { PublicKey, TopicInfoQuery } from "@hashgraph/sdk";

// Store active subscriptions in memory
// Note: this will be lost on server restart but we'll recover them from the database
const activeSubscriptions = new Map<string, SubscriptionHandle>();

/**
 * Handles incoming topic messages by saving them to the database
 *
 * @param {string} topicId - The ID of the topic receiving the message
 * @param {string} message - The message content
 * @param {Date} timestamp - The consensus timestamp
 * @returns {Promise<void>}
 */
const handleTopicMessage = async (
  topicId: string,
  message: string,
  timestamp: Date
): Promise<void> => {
  try {
    // Check if this exact message already exists for this topic
    const existingMessage = await TopicMessageModel.findOne({
      topicId,
      message,
    });

    if (existingMessage) {
      logger.info(`Duplicate message ignored for topic ${topicId}: ${message}`);
      return;
    }

    await TopicMessageModel.create({
      topicId,
      message,
      consensusTimestamp: timestamp,
    });
    logger.info(`Saved new message for topic ${topicId}`);
  } catch (error: any) {
    logger.error(
      `Error saving new message for topic ${topicId}: ${error.message}`
    );
    throw new Error(
      `Error saving new message for topic ${topicId}: ${error.message}`
    );
  }
};

/**
 * Initialize all active topic listeners on server startup
 *
 * @param {Client} client - Hedera client
 * @returns {Promise<void>}
 */
export const initializeTopicListeners = async (
  client: Client
): Promise<void> => {
  try {
    // Get all active topic listeners from database
    const activeListeners = await TopicListenerModel.find({ isActive: true });

    if (activeListeners.length === 0) {
      logger.info("No active topic listeners to initialize");
      return;
    }

    // Set up each listener
    const setupPromises = activeListeners.map(async (listener) => {
      try {
        const subscription = await setupTopicListener(
          client,
          TopicId.fromString(listener.topicId),
          handleTopicMessage
        );

        // Store the subscription in memory
        if (subscription) {
          activeSubscriptions.set(listener.topicId, subscription);
          logger.info(`Re-initialized listener for topic: ${listener.topicId}`);
        } else {
          throw new Error();
        }
      } catch (error: any) {
        logger.error(
          `Failed to initialize listener for topic ${listener.topicId}: ${error.message}`
        );

        // Mark as inactive since we couldn't set it up
        await TopicListenerModel.findOneAndUpdate(
          { topicId: listener.topicId },
          { isActive: false }
        );
      }
    });

    await Promise.all(setupPromises);
    logger.info("Topic listener initialization complete");
  } catch (error: any) {
    logger.error(`Error initializing topic listeners: ${error.message}`);
    throw new Error(`Error initializing topic listeners: ${error.message}`);
  }
};

/**
 * Setup a listener for a Hedera topic
 *
 * @param {string} topicId - Topic ID to listen to
 * @param {Client} client - Hedera client instance
 * @returns {Promise<TopicListenResponse>} Response indicating success or failure
 */
export const setupHederaTopicListener = async (
  topicId: string,
  client: Client
): Promise<TopicListenResponse> => {
  try {
    // Check if we're already listening to this topic in database
    const existingListener = await TopicListenerModel.findOne({ topicId });
    if (existingListener?.isActive) {
      return {
        success: false,
        error: "Already listening to this topic",
      };
    }

    // Set up the Hedera topic listener with callback to save messages
    const subscription = await setupTopicListener(
      client,
      TopicId.fromString(topicId),
      handleTopicMessage
    );

    // Store subscription in memory
    if (subscription) {
      activeSubscriptions.set(topicId, subscription);
    } else {
      throw new Error(
        "Failed to set up topic listener for topic ID: " + topicId
      );
    }

    // Create or update the topic listener in database
    await TopicListenerModel.findOneAndUpdate(
      { topicId },
      { topicId, isActive: true },
      { upsert: true, new: true }
    );

    logger.info(`Started listening to topic: ${topicId}`);

    return {
      success: true,
      message: `Started listening to topic: ${topicId}`,
    };
  } catch (error: any) {
    // Clean up if needed
    if (activeSubscriptions.has(topicId)) {
      try {
        const subscription = activeSubscriptions.get(topicId);
        if (subscription) {
          subscription.unsubscribe();
          activeSubscriptions.delete(topicId);
        }
      } catch (cleanupError: any) {
        logger.warn(
          `Failed to clean up subscription for ${topicId}: ${cleanupError.message}`
        );
      }
    }

    logger.error(`Error setting up topic listener: ${error.message}`);
    throw new Error(`Error setting up topic listener: ${error.message}`);
  }
};

/**
 * Check the status of a topic listener
 *
 * @param {string} topicId - Topic ID to check
 * @returns {Promise<TopicStatusResponse>} Response with topic status
 */
export const getTopicStatus = async (
  topicId: string
): Promise<TopicStatusResponse> => {
  try {
    const listener = await TopicListenerModel.findOne({ topicId });
    const isActive = listener?.isActive || false;

    // Consistency check - if DB says active but no subscription in memory,
    // we still report as active since we'll recover it on next restart
    if (isActive && !activeSubscriptions.has(topicId)) {
      logger.warn(
        `Inconsistent state for topic ${topicId}: marked active in DB but no in-memory subscription`
      );
    }

    return {
      topicId,
      isActive,
    };
  } catch (error: any) {
    logger.error(`Error checking status for topic ${topicId}:`, error);
    throw new Error(
      `Error checking status for topic ${topicId}: ${error.message}`
    );
  }
};

/**
 * Get messages for a specific topic
 *
 * @param {string} topicId - Topic ID to get messages for
 * @param {number} [limit=DEFAULT_TOPIC_MESSAGES_LIMIT] - Maximum number of messages to return
 * @returns {Promise<{success: boolean, messages?: any[], error?: string, details?: string}>}
 *          Response with messages or error details
 */
export const getTopicMessages = async (
  topicId: string,
  limit = DEFAULT_TOPIC_MESSAGES_LIMIT
) => {
  try {
    const messages = await TopicMessageModel.find({ topicId })
      .sort({ consensusTimestamp: -1 })
      .limit(limit);

    return messages;
  } catch (error: any) {
    logger.error(
      `Error retrieving messages for topic ${topicId}: ${error.message}`
    );
    throw new Error(
      `Error retrieving messages for topic ${topicId}: ${error.message}`
    );
  }
};

/**
 * Mark a topic listener as inactive and stop listening
 *
 * @param {string} topicId - Topic ID to stop listening to
 * @param {Client} client - Hedera client instance
 * @returns {Promise<void>}
 * @throws {Error} If deactivation fails
 */
export const deactivateTopicListener = async (
  topicId: string,
  client: Client
): Promise<void> => {
  try {
    // Update database record first
    await TopicListenerModel.findOneAndUpdate({ topicId }, { isActive: false });

    // Try to unsubscribe if we have an active subscription
    const subscription = activeSubscriptions.get(topicId);
    if (subscription) {
      subscription.unsubscribe();
      activeSubscriptions.delete(topicId);
      logger.info(`Unsubscribed from topic: ${topicId}`);
    } else {
      logger.info(
        `No active subscription found for topic: ${topicId}, only database updated`
      );
    }

    logger.info(`Deactivated topic listener for ${topicId}`);
  } catch (error: any) {
    logger.error(`Error deactivating topic ${topicId}:`, error);
    throw new Error(`Error deactivating topic ${topicId}: ${error.message}`);
  }
};

/**
 * Parse campaign data from a message
 *
 * @param {string} message - The message content to parse
 * @returns {ParsedCampaignData | null} Parsed campaign data or null if parsing fails
 */
export const parseCampaignMessage = (
  message: string
): ParsedCampaignData | null => {
  try {
    // Parse the comma-separated values directly from the message
    const [txId, topicId, name, accountId, prizePoolStr, requirement] =
      message.split(", ");

    // Convert prize pool to number
    const prizePool = parseInt(prizePoolStr);

    // Validate all required fields are present
    if (
      !txId ||
      !topicId ||
      !name ||
      !accountId ||
      isNaN(prizePool) ||
      !requirement
    ) {
      return null;
    }

    return {
      txId,
      topicId,
      name,
      accountId,
      prizePool,
      requirement,
    };
  } catch (error) {
    logger.error(`Error parsing campaign message: ${error}`);
    return null;
  }
};

/**
 * Verify signature using HashConnect
 *
 * @param {string} message - The signed message
 * @param {string} signature - The signature to verify
 * @param {string} publicKey - The public key to verify against
 * @returns {Promise<boolean>} Whether the signature is valid
 */
export const verifySignature = async (
  message: string,
  signature: string,
  publicKey: string
): Promise<boolean> => {
  try {
    // Hashconnect adds a prefix to the message before signing, so we need to do the same
    message = "\x19Hedera Signed Message:\n" + message.length + message;
    const mess = Buffer.from(message);
    const sig = Buffer.from(signature, "base64");

    // Verify the signature
    const pubKey = PublicKey.fromString(publicKey);
    const verified = pubKey.verify(mess, sig);

    return verified;
  } catch (error) {
    logger.error(`Error verifying campaign signature: ${error}`);
    return false;
  }
};

/**
 * Verify topic exists on the Hedera network
 *
 * @param {string} topicId - Topic ID to verify
 * @param {Client} client - Hedera client instance
 * @returns {Promise<boolean>} Whether the topic exists
 */
export const verifyTopicExists = async (
  topicId: string,
  client: Client
): Promise<boolean> => {
  try {
    const topicInfo = await new TopicInfoQuery()
      .setTopicId(TopicId.fromString(topicId))
      .execute(client);

    return !!topicInfo.topicId;
  } catch (error) {
    logger.error(`Error verifying topic exists: ${error}`);
    return false;
  }
};

/**
 * Create a new campaign from verified message data
 *
 * @param {ParsedCampaignData} campaignData - Parsed campaign data
 * @returns {Promise<{success: boolean, campaign?: any, error?: string}>} Result of campaign creation
 */
export const createCampaign = async (
  campaignData: ParsedCampaignData
): Promise<{ success: boolean; campaign?: any; error?: string }> => {
  try {
    // Create the campaign record
    const campaign = await CampaignModel.create({
      topicId: campaignData.topicId,
      name: campaignData.name,
      accountId: campaignData.accountId,
      prizePool: campaignData.prizePool,
      requirement: campaignData.requirement,
      txId: campaignData.txId,
    });

    return {
      success: true,
      campaign: campaign.toJSON(),
    };
  } catch (error: any) {
    logger.error(`Error creating campaign: ${error.message}`);
    return {
      success: false,
      error: error.message,
    };
  }
};

/**
 * Count all campaigns
 * @returns {Promise<number>} Total number of campaigns
 */
export const countCampaigns = async (): Promise<number> => {
  try {
    return await CampaignModel.countDocuments();
  } catch (error) {
    logger.error("Error counting campaigns:", error);
    throw error;
  }
};

/**
 * Get all campaigns with pagination
 * @param {number} skip Number of campaigns to skip
 * @param {number} limit Maximum number of campaigns to return
 * @returns {Promise<Campaign[]>} Array of campaigns
 */
export const listCampaigns = async (
  skip: number,
  limit: number
): Promise<Campaign[]> => {
  try {
    return await CampaignModel.find()
      .sort({ createdAt: -1 }) // Sort by newest first
      .skip(skip)
      .limit(limit);
  } catch (error) {
    logger.error("Error listing campaigns: " + error);
    throw error;
  }
};

/**
 * Parse topic message data from a message
 *
 * @param {string} message - The message content to parse
 * @returns {ParsedTopicMessageData | null} Parsed topic message data or null if parsing fails
 */
export const parseTopicMessage = (
  message: string
): ParsedTopicMessageData | null => {
  try {
    // Parse the comma-separated values from the message
    const [topicId, consensusTimestamp, twitterHandle] = message.split(", ");

    // Validate all required fields are present
    if (!topicId || !consensusTimestamp || !twitterHandle) {
      return null;
    }

    return {
      topicId,
      consensusTimestamp,
      message: twitterHandle,
    };
  } catch (error) {
    logger.error(`Error parsing topic message: ${error}`);
    return null;
  }
};

/**
 * Verify a topic message exists with the given information
 *
 * @param {ParsedTopicMessageData} messageData - Parsed topic message data
 * @returns {Promise<boolean>} Whether the message exists in the database
 */
export const verifyTopicMessage = async (
  messageData: ParsedTopicMessageData
): Promise<boolean> => {
  try {
    // Convert consensus timestamp string to Date
    const timestamp = new Date(messageData.consensusTimestamp);

    // Allow a small time window around the claimed timestamp (7 seconds)
    const startTime = new Date(timestamp.getTime() - 7000); // 7 seconds before
    const endTime = new Date(timestamp.getTime() + 7000); // 7 seconds after

    // Look for a message with the given topic ID and message content
    // that was created around the claimed timestamp since we have topic listener running
    const existingMessage = await TopicMessageModel.findOne({
      topicId: messageData.topicId,
      message: messageData.message,
      consensusTimestamp: {
        $gte: startTime,
        $lte: endTime,
      },
    });

    return !!existingMessage;
  } catch (error) {
    logger.error(`Error verifying topic message: ${error}`);
    return false;
  }
};

/**
 * Get a campaign by topic ID
 * @param {string} topicId Topic ID of the campaign
 * @returns {Promise<Campaign | null>} Campaign or null if not found
 */
export const getCampaignByTopicId = async (
  topicId: string
): Promise<Campaign | null> => {
  try {
    return await CampaignModel.findOne({ topicId });
  } catch (error) {
    logger.error(`Error getting campaign by topic ID ${topicId}: ${error}`);
    throw error;
  }
};
