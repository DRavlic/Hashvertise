import logger from "../common/common.instances";
import { TWITTERAPI_API_KEY } from "../environment";
import {
  TWITTER_API_BASE_URL,
  TWITTER_USER_LAST_TWEETS_ENDPOINT,
} from "./x.constants";
import { TwitterApiResponse } from "./x.interfaces";

/**
 * Fetches the last tweets of a Twitter user
 *
 * @param {string} userName - Twitter username
 * @param {string} cursor - Cursor for pagination (optional)
 * @returns {Promise<TwitterApiResponse>} - Twitter API response
 */
export const fetchUserLastTweets = async (
  userName: string,
  cursor?: string
): Promise<TwitterApiResponse> => {
  try {
    const url = new URL(
      `${TWITTER_API_BASE_URL}${TWITTER_USER_LAST_TWEETS_ENDPOINT}`
    );
    url.searchParams.append("userName", userName);

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

    logger.info(
      `Fetching tweets for user: ${userName}${
        cursor ? ` with cursor: ${cursor}` : ""
      }`
    );
    const response = await fetch(url.toString(), options);
    const data = (await response.json()) as TwitterApiResponse;

    if (!response.ok) {
      logger.error(`Error fetching tweets: ${JSON.stringify(data)}`);
      return {
        error: data.error || response.status,
        message: data.message || `Error fetching tweets for ${userName}`,
      };
    }

    logger.info(`Successfully fetched tweets for user: ${userName}`);
    return data;
  } catch (error: any) {
    logger.error(`Exception fetching tweets: ${error.message}`);
    return {
      error: 500,
      message: `Internal error: ${error.message}`,
    };
  }
};
