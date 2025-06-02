import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { validateUserInfo } from "./user.service";
import logger from "../common/common.instances";

/**
 * Validate user info and create user if needed
 * Also optionally validate X handle if provided
 *
 * @param {Request} req - Express request object containing accountId and optional xHandle
 * @param {Response} res - Express response object
 * @returns {Promise<Response>} HTTP response with validation result
 */
export const validateUser = async (
  req: Request,
  res: Response
): Promise<Response> => {
  try {
    const { accountId, xHandle } = req.body;

    const result = await validateUserInfo(accountId, xHandle);

    if (!result.success) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        error: result.error,
      });
    }

    return res.status(StatusCodes.OK).json({
      success: true,
      message: result.message,
      user: result.user,
    });
  } catch (error: any) {
    logger.error("Error in validateUser controller:", error);
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      error: "Internal server error",
    });
  }
};
