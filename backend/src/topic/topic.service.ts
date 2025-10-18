import {
  Client,
  TopicId,
  SubscriptionHandle,
  PublicKey,
  TopicInfoQuery,
} from "@hashgraph/sdk";
import {
  TopicListenerModel,
  TopicMessageModel,
  CampaignModel,
  Campaign,
} from "./topic.model";
import logger from "../common/common.instances";
import {
  DEFAULT_TOPIC_MESSAGES_LIMIT,
  CAMPAIGN_START_DATE_BUFFER_MILISECONDS,
  MIN_CAMPAIGN_DURATION_MINUTES,
  MAX_CAMPAIGN_DURATION_MINUTES,
} from "./topic.constants";
import {
  TopicListenResponse,
  TopicStatusResponse,
  ParsedCampaignData,
  ParsedTopicMessageData,
} from "./topic.interfaces";
import {
  setupTopicListener,
  verifySignature,
  getContractDepositAmount,
} from "../common/common.hedera";
import { createUtcDate } from "../common/common.dates";
import { UserXModel } from "../x/x.model";
import { UserModel } from "../user/user.model";
import {
  CAMPAIGN_COMPLETION_MESSAGE_PREFIX,
  TINYBARS_PER_HBAR,
} from "../common/common.constants";
import { HASHVERTISE_SMART_CONTRACT_ADDRESS } from "../environment";
import BigNumber from "bignumber.js";

// Store active subscriptions in memory
// Note: this will be lost on server restart but we'll recover them from the database
const activeSubscriptions = new Map<string, SubscriptionHandle>();

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
    const [accountId, XHandle] = message.split(", ");

    // Validate all required fields are present
    if (!accountId || !XHandle) {
      return null;
    }

    return {
      accountId,
      XHandle,
    };
  } catch (error) {
    logger.error(`Error parsing topic message: ${error}`);
    return null;
  }
};

/**
 * Handles incoming topic messages by saving them to the database
 *
 * @param {string} topicId - The ID of the topic receiving the message
 * @param {string} message - The message content
 * @param {Date} hederaTimestamp - The consensus timestamp
 * @returns {Promise<void>}
 */
const handleTopicMessage = async (
  topicId: string,
  message: string,
  hederaTimestamp: Date
): Promise<void> => {
  try {
    // Parse the message in format: "<accountId>, <XHandle>"
    const parsedMessage = parseTopicMessage(message);

    // If the message is not in the correct format, check if it's a campaign over message
    if (!parsedMessage) {
      if (message.includes(CAMPAIGN_COMPLETION_MESSAGE_PREFIX)) {
        const [campaignMessage, signaturePart] = message.split("|");
        const isValid = verifySignature(campaignMessage, signaturePart);
        if (isValid) {
          await deactivateTopicListener(topicId); // TODO: check if we need to handle an error from this function

          logger.info(
            `Campaign finished: deactivating topic listener for topic ${topicId}`
          );
          return;
        } else {
          logger.info(
            `Invalid signature for campaign over message for topic ${topicId}, skipping...`
          );
          return;
        }
      }

      logger.info(`Invalid message format: "${message}", skipping...`);
      return;
    }

    // Check if this account ID exists in our user database
    const user = await UserModel.findOne({
      accountId: parsedMessage.accountId,
    });
    if (!user) {
      logger.info(
        `Account ${parsedMessage.accountId} not found in our database, skipping...`
      );
      return;
    }

    // Check if this X handle is valid and actually exists in our database (which should have happened before user submitted message to topic)
    const userX = await UserXModel.findOne({ xHandle: parsedMessage.XHandle });
    if (!userX) {
      logger.info(
        `X handle ${parsedMessage.XHandle} not found in our database, skipping...`
      );
      return;
    }

    // Check if this X handle already applied for campaing of this topic
    const existingXHandle = await TopicMessageModel.findOne({
      topicId,
      message: { $regex: `, ${parsedMessage.XHandle}$` },
    });

    if (existingXHandle) {
      logger.info(
        `Duplicate X handle ${parsedMessage.XHandle} ignored for topic ${topicId}, skipping...`
      );
      return;
    }

    await TopicMessageModel.create({
      topicId,
      message,
      consensusTimestamp: hederaTimestamp, // No additional conversion needed since Hedera consensus timestamps are in UTC
    });
    logger.info(`Saved new message for topic ${topicId}`);
  } catch (error: any) {
    // TODO: see if this and other similar error logs are necessary
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

    // Get only topic IDs of campaigns that haven't ended yet
    const currentDate = createUtcDate();
    const activeCampaignResults = await CampaignModel.find(
      { endDateUtc: { $gte: currentDate } },
      { topicId: 1, _id: 0 }
    ).lean();

    // Extract just the topic IDs into a set for efficient lookup
    const activeCampaignTopicIds = new Set(
      activeCampaignResults.map((result) => result.topicId)
    );

    // Set up each listener only if it belongs to a campaign that hasn't ended
    const setupPromises = activeListeners.map(async (listener) => {
      try {
        // Skip listeners for campaigns that have ended or don't exist
        if (!activeCampaignTopicIds.has(listener.topicId)) {
          logger.info(
            `Skipping listener for ended/invalid campaign: ${listener.topicId}`
          );

          // Mark as inactive since the campaign has ended
          await TopicListenerModel.findOneAndUpdate(
            { topicId: listener.topicId },
            { isActive: false }
          );

          return;
        }

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
 * @returns {Promise<TopicMessageModel[]>} Array of topic messages sorted by consensus timestamp ascending
 */
export const getTopicMessages = async (
  topicId: string,
  limit = DEFAULT_TOPIC_MESSAGES_LIMIT
) => {
  try {
    const messages = await TopicMessageModel.find({ topicId })
      .sort({ consensusTimestamp: 1 })
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
const deactivateTopicListener = async (topicId: string): Promise<void> => {
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
 * Parse campaign data from a message and verify dates are valid
 *
 * @param {string} message - The message content to parse
 * @returns {ParsedCampaignData | null} Parsed campaign data or null if parsing fails
 */
export const parseCampaignMessage = (
  message: string
): ParsedCampaignData | null => {
  try {
    // Parse the comma-separated values directly from the message
    const [
      txId,
      topicId,
      name,
      accountId,
      prizePoolStr,
      requirement,
      startDateStr,
      endDateStr,
    ] = message.split(", ");

    // Convert prize pool to number
    const prizePool = parseInt(prizePoolStr);

    // Validate all required fields are present
    if (
      !txId ||
      !topicId ||
      !name ||
      !accountId ||
      isNaN(prizePool) ||
      !requirement ||
      !startDateStr ||
      !endDateStr
    ) {
      logger.error("Not all required fields are present in campaign message");
      return null;
    }

    // Check if dates are valid
    const startDateUtc = createUtcDate(new Date(startDateStr));
    const endDateUtc = createUtcDate(new Date(endDateStr));

    if (isNaN(startDateUtc.getTime()) || isNaN(endDateUtc.getTime())) {
      logger.error(
        `Invalid start date: ${startDateStr} or end date: ${endDateStr} format for campaign`
      );
      return null;
    }

    if (startDateUtc >= endDateUtc) {
      logger.error(
        `Start date: ${startDateStr} must be before end date: ${endDateStr} for campaign`
      );
      return null;
    }

    // Allow campaigns to start within a reasonable buffer
    const currentTime = createUtcDate();
    const bufferTimeAgo = new Date(currentTime.getTime() - CAMPAIGN_START_DATE_BUFFER_MILISECONDS);

    if (startDateUtc < bufferTimeAgo) {
      logger.error(
        `Start date: ${startDateStr} cannot be more than ${CAMPAIGN_START_DATE_BUFFER_MILISECONDS / 60000} minutes in the past for campaign`
      );
      return null;
    }

    // Validate campaign duration
    const durationMinutes = Math.floor((endDateUtc.getTime() - startDateUtc.getTime()) / 1000 / 60); // Convert milliseconds to minutes

    if (durationMinutes < MIN_CAMPAIGN_DURATION_MINUTES) {
      logger.error(
        `Campaign duration is less than minimum allowed duration of ${MIN_CAMPAIGN_DURATION_MINUTES} minutes`
      );
      return null;
    }

    if (durationMinutes > MAX_CAMPAIGN_DURATION_MINUTES) {
      logger.error(
        `Campaign duration is greater than maximum allowed duration of ${MAX_CAMPAIGN_DURATION_MINUTES / 24 / 60} days`
      );
      return null;
    }

    return {
      txId,
      topicId,
      name,
      accountId,
      prizePool,
      requirement,
      startDateUtc,
      endDateUtc,
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
export const verifySignatureFromHashConnect = async (
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
 * Verify that the advertiser has deposited enough funds into the smart contract.
 *
 * @param {Client} hederaClient - Hedera client instance.
 * @param {string} advertiserEvmAddress - The EVM address of the advertiser.
 * @param {string} topicId - The topic ID of the campaign.
 * @param {number} expectedPrizePoolInHbar - The prize pool amount in HBAR expected to be deposited.
 * @returns {Promise<boolean>} True if the deposit is sufficient, false otherwise.
 */
export const verifyAdvertiserDeposit = async (
  hederaClient: Client,
  advertiserEvmAddress: string,
  topicId: string,
  expectedPrizePoolInHbar: number
): Promise<boolean> => {
  try {
    if (!HASHVERTISE_SMART_CONTRACT_ADDRESS) {
      logger.error("Smart contract address is not configured.");
      return false;
    }

    // Get the advertiser's deposit amount in tinybars for this campaign from smart contract
    const depositAmountInTinybarsBigNum = await getContractDepositAmount(
      hederaClient,
      HASHVERTISE_SMART_CONTRACT_ADDRESS,
      advertiserEvmAddress,
      topicId
    );
    if (depositAmountInTinybarsBigNum === null) {
      logger.error(
        `Failed to retrieve deposit amount from contract for topic ${topicId}, advertiser ${advertiserEvmAddress}.`
      );
      return false;
    }

    const expectedPrizePoolInTinybarsBigNum = new BigNumber(
      expectedPrizePoolInHbar
    ).multipliedBy(TINYBARS_PER_HBAR);

    // Check if actual deposit is greater than or equal to expected
    return depositAmountInTinybarsBigNum.gte(expectedPrizePoolInTinybarsBigNum);
  } catch (error: any) {
    logger.error(
      `Error verifying advertiser deposit for topic ${topicId}: ${error.message}`
    );
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
      startDateUtc: campaignData.startDateUtc,
      endDateUtc: campaignData.endDateUtc,
    });

    logger.info(`Campaign ${campaign.name} created successfully`);
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
 * Get the total count of campaigns based on optional filters.
 *
 * @param filters - Optional filters for name and statuses.
 * @returns The total number of campaigns matching the filters.
 */
export const countCampaigns = async (
  filters: { name?: string; statuses?: string[] } = {}
): Promise<number> => {
  const query = buildCampaignQuery(filters);
  return CampaignModel.countDocuments(query);
};

/**
 * Get a paginated list of campaigns based on optional filters and sorting.
 *
 * @param page - The page number to retrieve.
 * @param limit - The number of campaigns per page.
 * @param options - Optional filters and sorting options.
 * @returns A list of campaigns for the specified page.
 */
export const listCampaigns = async (
  page: number,
  limit: number,
  options: {
    name?: string;
    sortBy?: string;
    sortOrder?: "asc" | "desc";
    statuses?: string[];
  } = {}
): Promise<Campaign[]> => {
  const { sortBy = "createdAt", sortOrder = "desc" } = options;
  const skip = (page - 1) * limit;

  const query = buildCampaignQuery(options);

  return CampaignModel.find(query)
    .sort({ [sortBy]: sortOrder === "desc" ? -1 : 1 })
    .skip(skip)
    .limit(limit)
    .lean();
};

/**
 * Get a campaign by its topic ID
 * @param {string} topicId Topic ID of the campaign
 * @returns {Promise<Campaign | null>} Campaign or null if not found
 */
export const getCampaignByTopicId = async (
  topicId: string
): Promise<Campaign | null> => {
  return CampaignModel.findOne({ topicId }).lean();
};

/**
 * Build a dynamic query for fetching campaigns based on filters.
 *
 * @param filters - Optional filters for name and statuses.
 * @returns A MongoDB query object.
 */
const buildCampaignQuery = (
  filters: { name?: string; statuses?: string[] } = {}
) => {
  const { name, statuses } = filters;
  const query: any = {};

  if (name) {
    query.name = { $regex: name, $options: "i" }; // Case-insensitive search
  }

  if (statuses && statuses.length > 0) {
    const now = new Date();
    const statusConditions: any[] = [];

    if (statuses.includes("UPCOMING")) {
      statusConditions.push({ startDateUtc: { $gt: now } });
    }
    if (statuses.includes("ACTIVE")) {
      statusConditions.push({
        startDateUtc: { $lte: now },
        endDateUtc: { $gt: now },
      });
    }
    if (statuses.includes("ENDED")) {
      statusConditions.push({ endDateUtc: { $lte: now } });
    }

    if (statusConditions.length > 0) {
      query.$or = statusConditions;
    }
  }

  return query;
};
