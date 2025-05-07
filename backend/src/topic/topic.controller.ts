import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import {
  setupHederaTopicListener as setupHederaTopicListenerService,
  getTopicStatus,
  getTopicMessages as getTopicMessagesService,
  deactivateTopicListener as deactivateTopicListenerService,
  parseCampaignMessage,
  verifySignature,
  verifyTopicExists,
  createCampaign,
  countCampaigns,
  listCampaigns,
  getCampaignByTopicId,
} from "./topic.service";
import logger from "../common/common.instances";
import {
  DEFAULT_TOPIC_MESSAGES_LIMIT,
  DEFAULT_PAGE,
  DEFAULT_CAMPAIGNS_LIMIT,
} from "./topic.constants";
import { UserModel } from "../common/common.model";

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
 * Deactivate a topic listener
 *
 * @param {Request} req - Express request object containing topicId in params
 * @param {Response} res - Express response object
 * @returns {Promise<Response>} HTTP response with deactivation result
 */
export const deactivateTopicListener = async (
  req: Request,
  res: Response
): Promise<Response> => {
  try {
    const { topicId } = req.params;
    const hederaClient = req.app.locals.hederaClient;

    await deactivateTopicListenerService(topicId, hederaClient);

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

/**
 * Verify campaign signature and create a campaign
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

    // Parse the campaign data from the message
    const campaignData = parseCampaignMessage(message);
    if (!campaignData) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        error: "Invalid message format",
      });
    }

    // Find the user by accountId
    const user = await UserModel.findOne({ accountId: campaignData.accountId });
    if (!user) {
      return res.status(StatusCodes.UNAUTHORIZED).json({
        success: false,
        error: "User not found",
      });
    }

    // Verify the signature
    const isSignatureValid = await verifySignature(
      message,
      signature,
      user.publicKey
    );

    if (!isSignatureValid) {
      return res.status(StatusCodes.UNAUTHORIZED).json({
        success: false,
        error: "Invalid signature",
      });
    }

    // Verify the topic exists
    const topicExists = await verifyTopicExists(
      campaignData.topicId,
      hederaClient
    );
    if (!topicExists) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        error: "Topic does not exist",
      });
    }

    // Create the campaign
    const createResult = await createCampaign(campaignData);
    if (!createResult.success) {
      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        success: false,
        error: "Failed to create campaign",
        details: createResult.error,
      });
    }

    // Set up the topic listener
    const listenerResult = await setupHederaTopicListenerService(
      campaignData.topicId,
      hederaClient
    );

    if (!listenerResult.success) {
      // If setting up listener fails, still return success since the campaign was created
      logger.warn(
        `Failed to set up listener for campaign: ${listenerResult.error}`
      );
    }

    return res.status(StatusCodes.CREATED).json({
      success: true,
      campaign: createResult.campaign,
      message: "Campaign created successfully",
    });
  } catch (error: any) {
    logger.error("Error in verifyCampaignAndCreate controller:", error);

    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      error: "Internal server error",
      details: error.message || String(error),
    });
  }
};

/**
 * @route GET /api/topic/campaigns
 * @description Get all campaigns with pagination
 * @access Public
 */
export const getCampaigns = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || DEFAULT_PAGE;
    const limit =
      parseInt(req.query.limit as string) || DEFAULT_CAMPAIGNS_LIMIT;
    const skip = (page - 1) * limit;

    // Get total count for pagination
    const total = await countCampaigns();

    // Get campaigns for current page
    const campaigns = await listCampaigns(skip, limit);

    return res.status(StatusCodes.OK).json({
      success: true,
      campaigns,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    logger.error("Error getting campaigns: " + error);
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      error: "Internal server error",
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
