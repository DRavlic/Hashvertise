import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import logger from "../common/common.instances";
import { fetchUserLastTweets } from "./x.service";

/**
 * Get the last tweets of a Twitter user
 *
 * @param {Request} req - Express request object with userName in params and optional cursor in query
 * @param {Response} res - Express response object
 * @returns {Promise<Response>} HTTP response with tweets or error
 */
export const getUserTweets = async (
  req: Request,
  res: Response
): Promise<Response> => {
  try {
    const { userName, cursor } = req.params;

    const twitterResponse = await fetchUserLastTweets(userName, cursor);

    // Check if there was an error from the Twitter API
    if (twitterResponse.error) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        error: twitterResponse.message || "Error fetching tweets",
        errorCode: twitterResponse.error,
      });
    }

    return res.status(StatusCodes.OK).json({
      success: true,
      data: twitterResponse,
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
