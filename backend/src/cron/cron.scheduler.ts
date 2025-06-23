import cron from "node-cron";
import { processEndedCampaigns } from "./cron.service";
import { PROCESS_ENDED_CAMPAIGNS_SCHEDULE } from "./cron.constants";
import logger from "../common/common.instances";

/**
 * Initializes and schedules all cron jobs for the application.
 */
export const initCronJobs = () => {
  logger.info("Initializing cron jobs...");

  // Schedule the campaign processing job.
  cron.schedule(PROCESS_ENDED_CAMPAIGNS_SCHEDULE, async () => {
    logger.info("CRON: Triggering scheduled campaign processing.");
    try {
      await processEndedCampaigns();
    } catch (error) {
      logger.error(
        "CRON: An unexpected error occurred during the cron job execution.",
        error
      );
    }
  });

  // Immediately run the job on startup to process any campaigns that ended while the server was offline.
  logger.info("CRON: Running startup check for ended campaigns...");
  processEndedCampaigns();

  logger.info("Cron jobs have been scheduled successfully.");
};
