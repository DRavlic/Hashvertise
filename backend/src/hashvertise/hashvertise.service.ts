import { Hashvertise, HashvertiseModel } from "./hashvertise.model";
import logger from "../common/common.instances";
import { HashvertiseConfig } from "./hashvertise.interfaces";

/**
 * Get the Hashvertise configuration
 * @returns Promise<Hashvertise | null>
 */
export const getConfig = async (): Promise<Hashvertise | null> => {
  try {
    const config = await HashvertiseModel.findOne();
    return config;
  } catch (error: any) {
    logger.error("Error fetching Hashvertise config:", error);
    throw new Error("Failed to fetch Hashvertise configuration");
  }
};

/**
 * Create or update the Hashvertise configuration
 * @param configData - Configuration data to save
 * @returns Promise<Hashvertise>
 */
export const setConfig = async (
  configData: HashvertiseConfig
): Promise<Hashvertise> => {
  try {
    const existingConfig = await HashvertiseModel.findOne();

    if (existingConfig) {
      // Update existing config
      existingConfig.feeBasisPoints = configData.feeBasisPoints;
      existingConfig.minimumDepositInTinybars =
        configData.minimumDepositInTinybars;
      existingConfig.contractAddress = configData.contractAddress;

      const updatedConfig = await existingConfig.save();
      return updatedConfig;
    } else {
      // Create new config
      return HashvertiseModel.create(configData);
    }
  } catch (error: any) {
    logger.error("Error upserting Hashvertise config:", error);
    throw new Error("Failed to save Hashvertise configuration");
  }
};
