import { Request, Response } from "express";
import { z } from "zod";
import { hederaClient } from "../common/common.hedera";
import logger from "../common/common.instances";
import { DEFAULT_NETWORK, ERROR_MESSAGES } from "./consensus.constants";
import {
  SubmitMessageRequest,
  SubmitMessageResponse,
} from "./consensus.interfaces";
import { submitMessage as submitMessageService } from "./consensus.service";

// Validate request body schema
const submitMessageSchema = z.object({
  network: z.enum(["testnet", "mainnet"]).default(DEFAULT_NETWORK),
  accountId: z.string().min(1),
  message: z.string().min(1),
  topicId: z.string().optional(),
});

/**
 * Submit a consensus message to a Hedera topic
 *
 * @param {Request} req - Express request object containing message data in body
 * @param {Response} res - Express response object
 * @returns {Promise<Response>} HTTP response with success or error information
 */
export const submitMessage = async (req: Request, res: Response) => {
  try {
    // Validate request body
    const validatedData = submitMessageSchema.parse(
      req.body
    ) as SubmitMessageRequest;

    // Call service to handle the message submission
    const result = await submitMessageService(hederaClient, validatedData);

    if (!result.success) {
      return res.status(500).json(result as SubmitMessageResponse);
    }

    // Return success response
    return res.status(200).json(result as SubmitMessageResponse);
  } catch (error: any) {
    logger.error(`Error in submitMessage controller: ${error.message}`);

    // Handle validation errors
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: ERROR_MESSAGES.INVALID_REQUEST,
        details: error.errors,
      } as SubmitMessageResponse);
    }

    // Return generic error
    return res.status(500).json({
      success: false,
      error: ERROR_MESSAGES.SUBMIT_FAILED,
      details: error.message || String(error),
    } as SubmitMessageResponse);
  }
};
