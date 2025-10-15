import { CampaignModel } from "../topic/topic.model";
import { distributeReward } from "../x/x.service";
import logger from "../common/common.instances";

/**
 * Process a specific campaign by topicId when we know it has ended.
 */
export const processSpecificCampaign = async (topicId: string): Promise<void> => {
  logger.info(`CRON: Processing campaign ${topicId}...`);

  try {
    const campaign = await CampaignModel.findOne({
      topicId,
      rewardsDistributed: false,
    });

    if (!campaign) {
      logger.info(`CRON: Campaign ${topicId} not found or already processed.`);
      return;
    }

    // Double-check that the campaign has actually ended
    const now = new Date();
    if (campaign.endDateUtc > now) {
      logger.warn(`CRON: Campaign ${topicId} has not ended yet (ends at ${campaign.endDateUtc.toISOString()}). Skipping.`);
      return;
    }

    const result = await distributeReward(campaign.topicId);

    if (result.success) {
      campaign.rewardsDistributed = true;
      await campaign.save();
      logger.info(
        `CRON: Successfully processed and marked campaign ${campaign.topicId} as distributed.`
      );
    } else {
      logger.error(
        `CRON: Failed to distribute rewards for campaign ${campaign.topicId}. Error: ${result.error}`
      );
    }
  } catch (error: any) {
    logger.error(
      `CRON: An unexpected error occurred while processing campaign ${topicId}.`,
      error
    );
  }
};

/**
 * Fallback function to find and process ALL campaigns that have ended but have not had their rewards distributed yet for some reason
 */
export const processEndedCampaignsFallback = async (): Promise<void> => {
  const now = new Date();
  logger.info("CRON: Running fallback check for ended campaigns...");

  try {
    const campaignsToProcess = await CampaignModel.find({
      endDateUtc: { $lte: now },
      rewardsDistributed: false,
    });

    if (campaignsToProcess.length === 0) {
      logger.info("CRON: No ended campaigns found in fallback check.");
      return;
    }

    logger.info(
      `CRON: Found ${campaignsToProcess.length} campaigns to process in fallback check.`
    );

    for (const campaign of campaignsToProcess) {
      try {
        logger.info(`CRON: Processing campaign ${campaign.topicId} in fallback...`);
        const result = await distributeReward(campaign.topicId);

        if (result.success) {
          campaign.rewardsDistributed = true;
          await campaign.save();
          logger.info(
            `CRON: Successfully processed and marked campaign ${campaign.topicId} as distributed in fallback.`
          );
        } else {
          logger.error(
            `CRON: Failed to distribute rewards for campaign ${campaign.topicId} in fallback. Error: ${result.error}`
          );
        }
      } catch (error: any) {
        logger.error(
          `CRON: An unexpected error occurred while processing campaign ${campaign.topicId} in fallback.`,
          error
        );
      }
    }
  } catch (error: any) {
    logger.error(
      "CRON: An error occurred while fetching campaigns for fallback processing.",
      error
    );
  }
};
