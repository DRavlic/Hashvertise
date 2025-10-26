import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import {
  setupHederaTopicListener as setupHederaTopicListenerService,
  getTopicStatus,
  getTopicMessages as getTopicMessagesService,
  parseCampaignMessage,
  verifySignatureFromHashConnect,
  verifyTopicExists,
  createCampaign,
  countCampaigns,
  listCampaigns,
  getCampaignByTopicId,
  verifyAdvertiserDeposit,
  getUserParticipations,
  getUserCreatedCampaigns,
} from "./topic.service";
import logger from "../common/common.instances";
import { scheduleCampaignEndProcessing } from "../scheduler/scheduler.manager";
import {
  DEFAULT_TOPIC_MESSAGES_LIMIT,
  DEFAULT_PAGE,
  DEFAULT_CAMPAIGNS_LIMIT,
} from "./topic.constants";
import { UserModel } from "../user/user.model";

/**
 * Set up a topic listener for a Hedera topic
 *
 * @param {Request} req - Express request object containing topicId in body
 * @param {Response} res - Express response object
 * @returns {Promise<Response>} HTTP response with setup result
 */
export const setupHederaTopicListener = async (
  req: Request,
  res: Response
): Promise<Response> => {
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
 * Check the status of a topic listener
 *
 * @param {Request} req - Express request object containing topicId in params
 * @param {Response} res - Express response object
 * @returns {Promise<Response>} HTTP response with topic status
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
 *
 * @param {Request} req - Express request object containing topicId in params and optional limit in query
 * @param {Response} res - Express response object
 * @returns {Promise<Response>} HTTP response with topic messages or error
 */
export const getTopicMessages = async (
  req: Request,
  res: Response
): Promise<Response> => {
  try {
    const { topicId } = req.params;
    const limit =
      (req.query.limit as unknown as number) || DEFAULT_TOPIC_MESSAGES_LIMIT;

    const messages = await getTopicMessagesService(topicId, limit);

    return res.status(StatusCodes.OK).json({
      success: true,
      messages,
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
 * Verify a signed campaign message and create the campaign
 *
 * @param {Request} req - Express request object containing message and signature
 * @param {Response} res - Express response object
 * @returns {Promise<Response>} HTTP response with campaign verification result
 */
export const verifyCampaignAndCreate = async (
  req: Request,
  res: Response
): Promise<Response> => {
  try {
    const { message, signature } = req.body;
    const hederaClient = req.app.locals.hederaClient;

    if (!message || !signature) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        error: "Message and signature are required",
      });
    }

    // Parse the campaign data from the message advertiser sent from frontend
    const campaignData = parseCampaignMessage(message);
    if (!campaignData) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        error: "Invalid message format",
      });
    }

    // Get the public key for the advertiser (should already exist since validation was done)
    const user = await UserModel.findOne({ accountId: campaignData.accountId });
    if (!user || !user.publicKey || !user.evmAddress) {
      return res.status(StatusCodes.NOT_FOUND).json({
        success: false,
        error:
          "User not found, missing public key or EVM address. Please validate user info first.",
      });
    }

    // Verify if actual advertiser signed the message
    const isValidSignature = await verifySignatureFromHashConnect(
      message,
      signature,
      user.publicKey
    );
    if (!isValidSignature) {
      return res.status(StatusCodes.UNAUTHORIZED).json({
        success: false,
        error: "Invalid signature",
      });
    }

    // TODO: check if we need to wait little bit for mirror node to sync with hedera network before verifying the topic exists

    // Verify the topic exists on Hedera
    const topicExists = await verifyTopicExists(
      campaignData.topicId,
      hederaClient
    );
    if (!topicExists) {
      return res.status(StatusCodes.NOT_FOUND).json({
        success: false,
        error: "Topic not found on Hedera network",
      });
    }

    // Verify if advertiser has deposited enough funds into the smart contract
    const depositVerified = await verifyAdvertiserDeposit(
      hederaClient,
      user.evmAddress,
      campaignData.topicId,
      campaignData.prizePool
    );
    if (!depositVerified) {
      return res.status(StatusCodes.EXPECTATION_FAILED).json({
        success: false,
        error:
          "Advertiser deposit not found in smart contract or insufficient for the stated prize pool.",
      });
    }

    // If all above checks pass, create the campaign
    const createResult = await createCampaign(campaignData);
    if (!createResult.success) {
      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        success: false,
        error: "Failed to create campaign",
        details: createResult.error,
      });
    }

    // Schedule the campaign end processing
    scheduleCampaignEndProcessing(campaignData.topicId, campaignData.endDateUtc);

    // Set up the topic listener (we're sure the topic exists at this point because we verified it earlier)
    const listenerResult = await setupHederaTopicListenerService(
      campaignData.topicId,
      hederaClient
    );
    if (!listenerResult.success) {
      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        success: false,
        error: "Failed to set up topic listener",
        details: listenerResult.error,
      });
    }

    return res.status(StatusCodes.CREATED).json({
      success: true,
      campaign: createResult.campaign,
      message: "Campaign verified and created successfully",
    });
  } catch (error: any) {
    logger.error("Error in verifyCampaignAndCreate controller:", error);
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      error: "Internal server error",
      details: error.message || String(error),
    });
  }
};

/**
 * Get all campaigns with pagination
 *
 * @param req - Express request object containing page, limit, name, sortBy, sortOrder, and statuses in query
 * @param res - Express response object
 * @returns A list of campaigns and total count
 */
export const getCampaigns = async (req: Request, res: Response) => {
  try {
    const {
      page = DEFAULT_PAGE,
      limit = DEFAULT_CAMPAIGNS_LIMIT,
      name,
      sortBy,
      sortOrder,
      statuses,
    } = req.query as any;

    const [campaigns, total] = await Promise.all([
      listCampaigns(page, limit, { name, sortBy, sortOrder, statuses }),
      countCampaigns({ name, statuses }),
    ]);

    return res.status(StatusCodes.OK).json({
      success: true,
      campaigns,
      total,
      page,
      limit,
    });
  } catch (error: any) {
    logger.error("Error in getCampaigns controller:", error);
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      error: "Internal server error",
      details: error.message || String(error),
    });
  }
};

/**
 * Get a campaign by topic ID
 *
 * @param {Request} req - Express request object containing topicId in params
 * @param {Response} res - Express response object
 * @returns {Promise<Response>} HTTP response with campaign data or error
 */
export const getCampaign = async (
  req: Request,
  res: Response
): Promise<Response> => {
  try {
    const { topicId } = req.params;

    const campaign = await getCampaignByTopicId(topicId);

    if (!campaign) {
      return res.status(StatusCodes.NOT_FOUND).json({
        success: false,
        error: "Campaign not found",
      });
    }

    return res.status(StatusCodes.OK).json({
      success: true,
      campaign,
    });
  } catch (error: any) {
    logger.error("Error in getCampaign controller:", error);

    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      error: "Internal server error",
      details: error.message || String(error),
    });
  }
};

/**
 * Get campaign results by topic ID
 *
 * @param req - Express request object containing topicId in params
 * @param res - Express response object
 * @returns A list of campaign results
 */
export const getCampaignResults = async (req: Request, res: Response) => {
  try {
    const { topicId } = req.params;
    const campaign = await getCampaignByTopicId(topicId);
    if (!campaign) {
      return res.status(StatusCodes.NOT_FOUND).json({
        success: false,
        error: "Campaign not found",
      });
    }
    return res.status(StatusCodes.OK).json({
      success: true,
      results: campaign.results || [],
    });
  } catch (error: any) {
    logger.error("Error in getCampaignResults controller:", error);
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      error: "Internal server error",
      details: error.message || String(error),
    });
  }
};

/**
 * Get user participations
 *
 * @param req - Express request object containing accountId in params
 * @param res - Express response object
 * @returns A list of user participations with campaign data
 */
export const getParticipations = async (req: Request, res: Response) => {
  try {
    const { accountId } = req.params;

    const participations = await getUserParticipations(accountId);

    return res.status(StatusCodes.OK).json({
      success: true,
      participations,
      total: participations.length,
    });
  } catch (error: any) {
    logger.error("Error in getParticipations controller:", error);
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      error: "Internal server error",
      details: error.message || String(error),
    });
  }
};

/**
 * Get campaigns created by a specific account
 *
 * @param {Request} req - Express request object containing accountId in params
 * @param {Response} res - Express response object
 * @returns List of campaigns with participant counts
 */
export const getCreatedCampaigns = async (req: Request, res: Response) => {
  try {
    const { accountId } = req.params;

    const campaigns = await getUserCreatedCampaigns(accountId);

    return res.status(StatusCodes.OK).json({
      success: true,
      campaigns,
      total: campaigns.length,
    });
  } catch (error: any) {
    logger.error("Error in getCreatedCampaigns controller:", error);
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      error: "Internal server error",
      details: error.message || String(error),
    });
  }
};
