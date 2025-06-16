import { UserModel } from "./user.model";
import { UserValidationResponse } from "./user.interfaces";
import {
  getAccountPublicKeyFromMirrorNode,
  getAccountEvmAddress,
  hederaClient,
} from "../common/common.hedera";
import { fetchUserInfo } from "../x/x.service";
import { UserXModel } from "../x/x.model";
import { createUtcDate } from "../common/common.dates";
import logger from "../common/common.instances";

/**
 * Validate user info and create user if needed
 * Also optionally validate X handle if provided
 *
 * @param {string} accountId - Hedera account ID
 * @param {string} [xHandle] - Optional X handle to validate
 * @returns {Promise<UserValidationResponse>} Validation result
 */
export const validateUserInfo = async (
  accountId: string,
  xHandle?: string
): Promise<UserValidationResponse> => {
  try {
    // Check if user already exists
    let user = await UserModel.findOne({ accountId });

    // If user doesn't exist, create them
    if (!user) {
      try {
        // Get public key from Hedera mirror node
        const publicKey = await getAccountPublicKeyFromMirrorNode(accountId);
        if (!publicKey) {
          return {
            success: false,
            error: "Could not retrieve public key from Hedera network",
          };
        }

        // Get EVM address from Hedera SDK
        const evmAddress = await getAccountEvmAddress(hederaClient, accountId);
        if (!evmAddress) {
          return {
            success: false,
            error: "Could not retrieve EVM address from Hedera network",
          };
        }

        // Create a new user
        user = await UserModel.create({
          accountId,
          publicKey,
          evmAddress,
        });

        logger.info(`Created new user from validation: ${accountId}`);
      } catch (error: any) {
        logger.error(`Error creating user during validation: ${error.message}`);
        return {
          success: false,
          error: "Failed to create user account",
        };
      }
    }

    // If X handle is provided, validate it
    if (xHandle) {
      try {
        // Check if X handle already exists in our database
        let userX = await UserXModel.findOne({ userName: xHandle });

        if (!userX) {
          // Validate X handle exists on X platform
          const userInfo = await fetchUserInfo(xHandle);
          if (!userInfo.success) {
            return {
              success: false,
              error: `X handle ${xHandle} not found on X platform`,
            };
          }

          // Create UserX record
          userX = await UserXModel.create({
            xId: userInfo.userInfo!.id,
            userName: xHandle,
            createdOnXUtc: createUtcDate(
              new Date(userInfo.userInfo!.createdAt)
            ),
          });

          logger.info(`Created new UserX record for: ${xHandle}`);
        }
      } catch (error: any) {
        logger.error(`Error validating X handle: ${error.message}`);
        return {
          success: false,
          error: `Failed to validate X handle: ${xHandle}`,
        };
      }
    }

    return {
      success: true,
      message: "User info validated successfully",
      user: {
        accountId: user.accountId,
        publicKey: user.publicKey,
        evmAddress: user.evmAddress,
      },
    };
  } catch (error: any) {
    logger.error("Error in validateUserInfo service:", error);
    return {
      success: false,
      error: "Internal server error",
    };
  }
};
