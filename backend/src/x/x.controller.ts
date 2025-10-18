import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import logger from "../common/common.instances";
import {
  fetchUserLastTweets,
  fetchUserInfo,
  distributeReward,
} from "./x.service";

/**
 * Get the last tweets of a Twitter user
 *
 * @param {Request} req - Express request object with xHandle in params and optional cursor in query
 * @param {Response} res - Express response object
 * @returns {Promise<Response>} HTTP response with tweets or error
 */
export const getUserTweets = async (
  req: Request,
  res: Response
): Promise<Response> => {
  try {
    const { xHandle } = req.params;
    const cursor = req.query.cursor as string | undefined;

    const userLastTweetsResponse = await fetchUserLastTweets(xHandle, cursor);

    if (!userLastTweetsResponse.success) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        error: userLastTweetsResponse.error,
      });
    }

    return res.status(StatusCodes.OK).json({
      success: true,
      data: {
        tweets: userLastTweetsResponse.tweets,
        hasNextPage: userLastTweetsResponse.hasNextPage,
        nextCursor: userLastTweetsResponse.nextCursor,
      },
    });
  } catch (error: any) {
    logger.error(`Error in getUserTweets controller: ${error.message}`);

    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      error: "Internal server error",
      details: error.message,
    });
  }
};

/**
 * Get user info from Twitter
 *
 * @param {Request} req - Express request object with xHandle in params
 * @param {Response} res - Express response object
 * @returns {Promise<Response>} HTTP response with user info or error
 */
export const getUserInfo = async (
  req: Request,
  res: Response
): Promise<Response> => {
  try {
    const { xHandle } = req.params;

    const userInfoResponse = await fetchUserInfo(xHandle);

    if (!userInfoResponse.success) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        error: userInfoResponse.error,
      });
    }

    return res.status(StatusCodes.OK).json({
      success: true,
      data: userInfoResponse.userInfo,
    });
  } catch (error: any) {
    logger.error(`Error in getUserInfo controller: ${error.message}`);

    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      error: "Internal server error",
      details: error.message,
    });
  }
};

/**
 * Distribute rewards for a campaign
 *
 * @param {Request} req - Express request object with topicId in params
 * @param {Response} res - Express response object
 * @returns {Promise<Response>} HTTP response with reward distribution result
 */
export const distributeRewards = async (
  req: Request,
  res: Response
): Promise<Response> => {
  try {
    const { topicId } = req.params;

    const distributionResult = await distributeReward(topicId);

    if (!distributionResult.success) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        error: distributionResult.error || "Failed to distribute rewards",
        topicId: distributionResult.topicId,
      });
    }

    return res.status(StatusCodes.OK).json({
      success: true,
      topicId: distributionResult.topicId,
      result: distributionResult.result,
      message: distributionResult.message,
    });
  } catch (error: any) {
    logger.error(`Error in distributeRewards controller: ${error.message}`);

    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      error: "Internal server error",
      details: error.message,
    });
  }
};
