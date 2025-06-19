import { Request, Response } from "express";
import { getConfig, setConfig } from "./hashvertise.service";
import { StatusCodes } from "http-status-codes";
import logger from "../common/common.instances";

export const getHashvertiseConfig = async (req: Request, res: Response) => {
  try {
    const config = await getConfig();

    if (!config) {
      return res.status(StatusCodes.NOT_FOUND).json({
        error: "Hashvertise configuration not found",
      });
    }

    res.json({
      feeBasisPoints: config.feeBasisPoints,
      minimumDepositInTinybars: config.minimumDepositInTinybars,
      contractAddress: config.contractAddress,
    });
  } catch (error: any) {
    logger.error("Error in getHashvertiseConfig:", error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      error: "Internal server error",
    });
  }
};

export const updateHashvertiseConfig = async (req: Request, res: Response) => {
  try {
    const { feeBasisPoints, minimumDepositInTinybars, contractAddress } =
      req.body;

    const updatedConfig = await setConfig({
      feeBasisPoints,
      minimumDepositInTinybars,
      contractAddress: contractAddress.trim(),
    });

    res.json({
      feeBasisPoints: updatedConfig.feeBasisPoints,
      minimumDepositInTinybars: updatedConfig.minimumDepositInTinybars,
      contractAddress: updatedConfig.contractAddress,
    });
  } catch (error: any) {
    logger.error("Error in updateHashvertiseConfig:", error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      error: "Internal server error",
    });
  }
};
