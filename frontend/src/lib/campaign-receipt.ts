import { HashvertiseConfig, CampaignCreationReceipt } from "./interfaces";
import { hbarToTinybars, tinybarsToHbar } from "./hbar-utils";
import { BASIS_POINTS_DIVISOR } from "./constants";

/**
 * Calculates receipt for campaign creation.
 */
export const getCampaignCreationReceipt = (
  prizeAmountHbar: number,
  config: HashvertiseConfig,
  startDate: Date,
  endDate: Date
): CampaignCreationReceipt => {
  const prizeAmountTinybars = hbarToTinybars(prizeAmountHbar);
  const feeAmountTinybars = Math.floor(
    (prizeAmountTinybars * config.feeBasisPoints) / BASIS_POINTS_DIVISOR
  );
  const totalAmountTinybars = prizeAmountTinybars + feeAmountTinybars;

  return {
    prizeAmountHbar: tinybarsToHbar(prizeAmountTinybars),
    feeAmountHbar: tinybarsToHbar(feeAmountTinybars),
    totalAmountHbar: tinybarsToHbar(totalAmountTinybars),
    feeBasisPoints: config.feeBasisPoints,
    isAboveMinimum: totalAmountTinybars >= config.minimumDepositInTinybars,
    startDate,
    endDate,
  };
};

/**
 * Formats fee percentage for display
 */
export const formatFeePercentage = (feeBasisPoints: number): string => {
  const percentage = feeBasisPoints / 100;
  return `${percentage}%`;
};
