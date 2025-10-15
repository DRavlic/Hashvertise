import cron from "node-cron";
import { processSpecificCampaign, processEndedCampaignsFallback } from "./cron.service";
import { PROCESS_ENDED_CAMPAIGNS_SCHEDULE_FALLBACK } from "./cron.constants";
import logger from "../common/common.instances";

// Store scheduled jobs for campaigns
const scheduledCampaignJobs = new Map<string, any>();

/**
 * Schedule a one-time job to process a specific campaign when it ends
 */
export const scheduleCampaignEndProcessing = (topicId: string, endDateUtc: Date) => {
  const now = new Date();
  const timeUntilEnd = endDateUtc.getTime() - now.getTime();

  // If campaign has already ended, process it immediately
  if (timeUntilEnd <= 0) {
    logger.info(`CRON: Campaign ${topicId} has already ended, processing immediately`);
    processSpecificCampaign(topicId);
    return;
  }

  // Cancel any existing job for this campaign
  if (scheduledCampaignJobs.has(topicId)) {
    scheduledCampaignJobs.get(topicId).destroy();
  }

  // Schedule the job
  const job = setTimeout(async () => {
    logger.info(`CRON: Campaign ${topicId} has ended, processing rewards...`);
    try {
      await processSpecificCampaign(topicId);
      scheduledCampaignJobs.delete(topicId);
    } catch (error) {
      logger.error(`CRON: Error processing campaign ${topicId}:`, error);
    }
  }, timeUntilEnd);

  scheduledCampaignJobs.set(topicId, job);
  logger.info(`CRON: Scheduled processing for campaign ${topicId} at ${endDateUtc.toISOString()}`);
};

/**
 * Initialize all scheduled campaigns on startup
 */
const initializeScheduledCampaigns = async () => {
  const { CampaignModel } = await import("../topic/topic.model");

  try {
    const now = new Date();
    const upcomingCampaigns = await CampaignModel.find({
      endDateUtc: { $gt: now },
      rewardsDistributed: false,
    });

    logger.info(`CRON: Found ${upcomingCampaigns.length} upcoming campaigns to schedule`);

    for (const campaign of upcomingCampaigns) {
      scheduleCampaignEndProcessing(campaign.topicId, campaign.endDateUtc);
    }
  } catch (error) {
    logger.error("CRON: Error initializing scheduled campaigns:", error);
  }
};

/**
 * Initializes and schedules all cron jobs for the application.
 */
export const initCronJobs = () => {
  logger.info("Initializing cron jobs...");

  // Schedule a lightweight fallback job that runs every hour
  // This catches any edge cases or missed campaigns
  cron.schedule(PROCESS_ENDED_CAMPAIGNS_SCHEDULE_FALLBACK, async () => {
    logger.info("CRON: Running hourly fallback check for ended campaigns...");
    try {
      await processEndedCampaignsFallback();
    } catch (error) {
      logger.error(
        "CRON: An unexpected error occurred during the fallback cron job execution.",
        error
      );
    }
  });

  // Immediately run the fallback check on startup to process any campaigns that ended while the server was offline.
  logger.info("CRON: Running startup fallback check for ended campaigns...");
  processEndedCampaignsFallback();

  // Initialize scheduled campaigns
  initializeScheduledCampaigns();

  logger.info("Cron jobs have been scheduled successfully.");
};
