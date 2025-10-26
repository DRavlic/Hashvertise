import logger from "../common/common.instances";
import {
  HEDERA_OPERATOR_ID_ECDSA,
  TWITTERAPI_API_KEY,
  HASHVERTISE_SMART_CONTRACT_ADDRESS,
} from "../environment";
import {
  TWITTER_API_BASE_URL,
  TWITTER_USER_INFO_ENDPOINT,
  TWITTER_USER_LAST_TWEETS_ENDPOINT,
} from "./x.constants";
import {
  TwitterUserLastTweetsResponse,
  DistributeRewardResponse,
  TwitterUserInfoResponse,
  UserTweetsServiceResponse,
  UserInfoServiceResponse,
  CampaignResultEntry,
} from "./x.interfaces";
import { TopicId } from "@hashgraph/sdk";
import {
  getTopicMessages,
  getCampaignByTopicId,
  parseTopicMessage,
} from "../topic/topic.service";
import {
  hederaClient,
  signMessage,
  submitMessageToTopic,
  distributePrizeToParticipants,
} from "../common/common.hedera";
import { UserModel } from "../user/user.model";
import { CAMPAIGN_COMPLETION_MESSAGE_PREFIX } from "../common/common.constants";
import BigNumber from "bignumber.js";
import { CampaignModel, CampaignParticipationModel } from "../topic/topic.model";

/**
 * Fetches the last tweets of a Twitter user
 *
 * @param {string} xHandle - Twitter username
 * @param {string} cursor - Cursor for pagination (optional)
 * @returns {Promise<UserTweetsServiceResponse>} - Clean service response
 */
export const fetchUserLastTweets = async (
  xHandle: string,
  cursor?: string
): Promise<UserTweetsServiceResponse> => {
  try {
    // Strip '@' from the beginning of xHandle if present
    const cleanXHandle = xHandle.startsWith("@")
      ? xHandle.substring(1)
      : xHandle;

    const url = new URL(
      `${TWITTER_API_BASE_URL}${TWITTER_USER_LAST_TWEETS_ENDPOINT}`
    );
    url.searchParams.append("userName", cleanXHandle);

    if (cursor !== undefined) {
      url.searchParams.append("cursor", cursor);
    }

    const options = {
      method: "GET",
      headers: {
        "X-API-Key": TWITTERAPI_API_KEY,
        "Content-Type": "application/json",
      },
    };

    const response = await fetch(url.toString(), options);
    const apiResponse =
      (await response.json()) as TwitterUserLastTweetsResponse;

    if (!response.ok || apiResponse.status !== "success") {
      logger.error(`Error fetching tweets: ${JSON.stringify(apiResponse)}`);
      return {
        success: false,
        error: apiResponse.msg || `Error fetching tweets for ${cleanXHandle}`,
      };
    }

    const tweetsData = apiResponse.data;
    if (!tweetsData) {
      return {
        success: false,
        error: `No data returned for ${cleanXHandle}`,
      };
    }

    return {
      success: true,
      tweets: tweetsData.tweets,
      hasNextPage: tweetsData.has_next_page,
      nextCursor: tweetsData.next_cursor,
    };
  } catch (error: any) {
    logger.error(`Exception fetching tweets: ${error.message}`);
    return {
      success: false,
      error: `Internal error: ${error.message}`,
    };
  }
};

/**
 * Gets user info from X
 *
 * @param {string} xHandle - X username
 * @returns {Promise<UserInfoServiceResponse>} - Clean service response
 */
export const fetchUserInfo = async (
  xHandle: string
): Promise<UserInfoServiceResponse> => {
  try {
    // Strip '@' from the beginning of xHandle if present
    const cleanXHandle = xHandle.startsWith("@")
      ? xHandle.substring(1)
      : xHandle;

    const url = new URL(`${TWITTER_API_BASE_URL}${TWITTER_USER_INFO_ENDPOINT}`);
    url.searchParams.append("userName", cleanXHandle);

    const options = {
      method: "GET",
      headers: {
        "X-API-Key": TWITTERAPI_API_KEY,
        "Content-Type": "application/json",
      },
    };

    const response = await fetch(url.toString(), options);
    const data = (await response.json()) as TwitterUserInfoResponse;

    if (!response.ok || data.status === "error") {
      logger.error(`Error fetching user info: ${JSON.stringify(data)}`);
      return {
        success: false,
        error: data.msg || `Error fetching user info for ${cleanXHandle}`,
      };
    }

    return {
      success: true,
      userInfo: data.data || undefined,
    };
  } catch (error: any) {
    logger.error(`Exception fetching user info: ${error.message}`);
    return {
      success: false,
      error: `Internal error: ${error.message}`,
    };
  }
};

/**
 * Distributes rewards for a campaign by analyzing tweet engagement,
 * calculating scores based on view counts, and distributing proportionally
 *
 * @param {string} topicId - Topic ID to distribute rewards for
 * @returns {Promise<DistributeRewardResponse>} - Response with distribution results and status
 */
export const distributeReward = async (
  topicId: string
): Promise<DistributeRewardResponse> => {
  let txId;

  try {
    logger.info(`Reward distribution started for topic: ${topicId}`);

    // Get campaign details to retrieve endDate and requirement
    const campaign = await getCampaignByTopicId(topicId);
    if (!campaign) {
      throw new Error(`Campaign not found for topic: ${topicId}`);
    }

    // Get all topic messages (sorted by consensus timestamp ascending)
    const messages = await getTopicMessages(topicId);

    // Create account score mapping
    const accountScores = new Map<string, number>();

    // Process each message until endDate of campaign
    for (const message of messages) {
      // Stop processing when message timestamp is greater than campaign endDate
      if (message.consensusTimestamp > campaign.endDateUtc) {
        break;
      }

      // Parse the message to get accountId and XHandle
      const parsedMessage = parseTopicMessage(message.message);
      if (!parsedMessage) {
        logger.info(
          `Invalid message format: "${message.message}", skipping...`
        );
        continue;
      }

      const { accountId, XHandle } = parsedMessage;

      // Fetch user's last tweets
      const tweetsResponse = await fetchUserLastTweets(XHandle);
      if (!tweetsResponse.success || !tweetsResponse.tweets) {
        logger.error(
          `success: ${tweetsResponse.success}, tweets: ${JSON.stringify(
            tweetsResponse.tweets
          )}`
        );
        logger.info(
          `Failed to fetch tweets for ${XHandle}, setting score to 0`
        );
        accountScores.set(accountId, (accountScores.get(accountId) || 0) + 0);
        continue;
      }

      // Find tweet that contains the campaign requirement
      const requirementTweet = tweetsResponse.tweets.find((tweet) => {
        // Check if tweet contains the requirement
        const containsRequirement = tweet.text.includes(campaign.requirement);

        // Check if tweet was created within campaign period
        const tweetCreatedAt = new Date(tweet.createdAt);
        const isAfterStartDate = tweetCreatedAt >= campaign.startDateUtc;
        const isBeforeEndDate = tweetCreatedAt <= campaign.endDateUtc;

        return containsRequirement && isAfterStartDate && isBeforeEndDate;
      });

      if (!requirementTweet) {
        logger.info(
          `No valid tweet found containing requirement "${campaign.requirement}" and created within campaign period for ${XHandle}, setting score to 0`
        );
        accountScores.set(accountId, (accountScores.get(accountId) || 0) + 0);
        continue;
      }

      // Add tweet's view count to account's score
      const score = requirementTweet.viewCount;
      accountScores.set(accountId, (accountScores.get(accountId) || 0) + score);
      logger.info(
        `Awarded ${score} score to account ${accountId} for ${XHandle}'s tweet created at ${requirementTweet.createdAt}`
      );
    }

    // Calculate total score
    const totalScore = Array.from(accountScores.values()).reduce(
      (sum, score) => sum + score,
      0
    );

    // Calculate proportional distribution (use BigNumber to avoid floating point precision issues)
    const distributions = new Map<string, BigNumber>();
    if (totalScore > 0) {
      const campaignPrizePoolHbarBigNum = new BigNumber(campaign.prizePool);
      const totalScoreBigNum = new BigNumber(totalScore);

      for (const [accountId, score] of accountScores) {
        if (score > 0) {
          const scoreBigNum = new BigNumber(score);
          const proportionalRewardHbarBigNum = scoreBigNum
            .dividedBy(totalScoreBigNum)
            .multipliedBy(campaignPrizePoolHbarBigNum);

          distributions.set(accountId, proportionalRewardHbarBigNum);
        }
      }
    }

    // Format result for the message
    const distributionEntries = Array.from(distributions.entries());
    const resultString =
      distributionEntries.length > 0
        ? distributionEntries
          .map(
            ([accountId, rewardBigNum]) =>
              `${accountId}:${rewardBigNum.toFixed()}`
          )
          .join(";")
        : "No valid applications found";

    logger.info(`Distribution results: ${resultString}`);

    // Execute smart contract distribution if there are valid distributions
    if (distributionEntries.length > 0) {
      logger.info(`Starting smart contract distribution for topic: ${topicId}`);

      // Get advertiser's EVM address (should already exist since validation was done prior campaign creation)
      const advertiser = await UserModel.findOne({
        accountId: campaign.accountId,
      });
      if (!advertiser || !advertiser.evmAddress) {
        throw new Error(
          `Advertiser not found or missing EVM address for account: ${campaign.accountId}`
        );
      }

      // Get participant users with their EVM addresses (should already exist since validation was done prior every message submission)
      const participantEvmAddresses: string[] = [];
      const amountsHbarBigNum: BigNumber[] = [];

      for (const [accountId, rewardHbarBigNum] of distributionEntries) {
        const participant = await UserModel.findOne({ accountId });

        if (!participant || !participant.evmAddress) {
          logger.error(
            `Participant not found or missing EVM address for account ${accountId}`
          );
          continue;
        }

        participantEvmAddresses.push(participant.evmAddress);
        amountsHbarBigNum.push(rewardHbarBigNum);
      }

      txId = await distributePrizeToParticipants(
        hederaClient,
        HASHVERTISE_SMART_CONTRACT_ADDRESS,
        advertiser.evmAddress,
        topicId,
        participantEvmAddresses,
        amountsHbarBigNum
      );

      if (txId) {
        logger.info(
          `Smart contract prize distribution successful. Transaction ID: ${txId}`
        );
      } else {
        logger.error(`Smart contract prize distribution failed`);
        throw new Error("Smart contract prize distribution failed");
      }
    } else {
      logger.warn(
        `No valid participant addresses found for smart contract distribution`
      );
    }

    // Build results array for winners
    const results: CampaignResultEntry[] = [];
    for (const [accountId, rewardHbarBigNum] of distributionEntries) {
      // Find the original topic message for this accountId
      const messageObj = messages.find((msg) => {
        const parsed = parseTopicMessage(msg.message);
        return parsed && parsed.accountId === accountId;
      });
      const xHandle = messageObj
        ? parseTopicMessage(messageObj.message)?.XHandle || ""
        : "";
      results.push({
        accountId,
        xHandle,
        prizeWonHbar: Number(rewardHbarBigNum.toFixed()),
      });
    }

    // Submit result of campaign as topic message
    const messageToSign = `${CAMPAIGN_COMPLETION_MESSAGE_PREFIX} ${topicId}. Final results by account ${HEDERA_OPERATOR_ID_ECDSA} are ${resultString}`;
    const signature = signMessage(messageToSign);
    if (!signature) {
      throw new Error("Failed to sign message");
    }

    const messageToSubmit = `${messageToSign}|${signature}`;
    await submitMessageToTopic(
      hederaClient,
      messageToSubmit,
      TopicId.fromString(topicId)
    );

    logger.info(
      `Successfully submitted results of reward distribution to topic ${topicId}`
    );

    // After successful distribution, save results to campaign
    if (campaign) {
      const updateData: any = {};

      if (distributionEntries.length > 0) {
        // There are valid applications and distributions
        updateData.results = results;
        updateData.resultTxId = txId;
        updateData.noValidApplications = false;
      } else {
        // No valid applications found
        updateData.noValidApplications = true;
        updateData.results = [];
      }

      await CampaignModel.findOneAndUpdate(
        { topicId },
        { $set: updateData },
        { new: true }
      );

      // Update participation records with prize amounts
      for (const result of results) {
        await CampaignParticipationModel.findOneAndUpdate(
          {
            topicId: topicId,
            xHandle: result.xHandle
          },
          {
            prizeWonHbar: result.prizeWonHbar
          }
        );
      }

      // Set prizeWonHbar to 0 for participants who didn't win anything
      const winnerXHandles = results.map(r => r.xHandle);
      await CampaignParticipationModel.updateMany(
        {
          topicId: topicId,
          xHandle: { $nin: winnerXHandles }
        },
        {
          prizeWonHbar: 0
        }
      );

      logger.info(`Updated participation records for campaign ${topicId}`);
    }

    return {
      success: true,
      topicId,
      result: resultString,
      message: `Campaign ended successfully. Distributed rewards to ${distributionEntries.length} accounts`,
    };
  } catch (error: any) {
    logger.error(
      `Error distributing rewards for topic ${topicId}: ${error.message}`
    );
    return {
      success: false,
      topicId,
      result: "",
      error: `Failed to distribute rewards: ${error.message}`,
    };
  }
};
