import { Client, TopicId, submitConsensusMessage } from "@hashvertise/crypto";
import logger from "./common.instances";
import {
  HEDERA_OPERATOR_ID,
  HEDERA_OPERATOR_KEY,
  HEDERA_NETWORK,
} from "../environment";

/**
 * Submit a message to a Hedera consensus topic
 *
 * @param {Client} client - Hedera client instance
 * @param {string} message - Message content to submit to the topic
 * @param {TopicId} [topicId] - Optional existing topic ID to submit to
 * @returns {Promise<TopicId | undefined>} The topic ID used or created, or undefined if operation failed
 */
export const submitMessageToTopic = async (
  client: Client,
  message: string,
  topicId?: TopicId
) => {
  try {
    // Log the operation
    logger.info(
      `Submitting message to Hedera${
        topicId ? ` topic ${topicId.toString()}` : " (new topic)"
      }`
    );

    // Delegate to crypto module
    const newTopicId = await submitConsensusMessage(client, message, topicId);

    if (newTopicId) {
      logger.info(
        `Message submitted successfully to topic ${newTopicId.toString()}`
      );
    } else {
      logger.error("Failed to submit message to Hedera");
    }

    return newTopicId;
  } catch (error: any) {
    logger.error(`Error submitting message to Hedera: ${error.message}`);
    return undefined;
  }
};

/**
 * Initialize a Hedera client with the configured credentials
 *
 * @returns {Client} Configured Hedera client instance
 * @throws {Error} If required environment variables are not set
 */
export const initializeHederaClient = (): Client => {
  // Create network-appropriate client
  const client =
    HEDERA_NETWORK === "mainnet" ? Client.forMainnet() : Client.forTestnet();

  if (!HEDERA_OPERATOR_ID || !HEDERA_OPERATOR_KEY) {
    throw new Error(
      "HEDERA_OPERATOR_ID and HEDERA_OPERATOR_KEY must be set in environment variables"
    );
  }

  client.setOperator(HEDERA_OPERATOR_ID, HEDERA_OPERATOR_KEY);
  logger.info(`Initialized Hedera client for ${HEDERA_NETWORK}`);

  return client;
};

// Create and export a singleton Hedera client
let hederaClient: Client;

try {
  hederaClient = initializeHederaClient();
  logger.info("Hedera client initialized successfully");
} catch (error) {
  logger.error("Failed to initialize Hedera client:", error);
  process.exit(1);
}

export { hederaClient };
