import { CampaignModel } from "../topic/topic.model";
import { distributeReward } from "../x/x.service";
import logger from "../common/common.instances";

/**
 * Finds and processes all campaigns that have ended but have not had their rewards distributed yet.
 */
export const processEndedCampaigns = async (): Promise<void> => {
  const now = new Date();
  logger.info("CRON: Checking for ended campaigns to process...");

  try {
    const campaignsToProcess = await CampaignModel.find({
      endDateUtc: { $lte: now },
      rewardsDistributed: false,
    });

    if (campaignsToProcess.length === 0) {
      logger.info("CRON: No ended campaigns found to process.");
      return;
    }

    logger.info(
      `CRON: Found ${campaignsToProcess.length} campaigns to process.`
    );

    for (const campaign of campaignsToProcess) {
      try {
        logger.info(`CRON: Processing campaign ${campaign.topicId}...`);
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
          `CRON: An unexpected error occurred while processing campaign ${campaign.topicId}.`,
          error
        );
      }
    }
  } catch (error: any) {
    logger.error(
      "CRON: An error occurred while fetching campaigns for processing.",
      error
    );
  }
};
