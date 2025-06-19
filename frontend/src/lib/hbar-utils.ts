import { TINYBARS_PER_HBAR } from "./constants";

/**
 * Converts HBAR to tinybars
 */
export const hbarToTinybars = (hbar: number): number => {
  return Math.floor(hbar * TINYBARS_PER_HBAR);
};

/**
 * Converts tinybars to HBAR
 */
export const tinybarsToHbar = (tinybars: number): number => {
  return tinybars / TINYBARS_PER_HBAR;
};

/**
 * Formats HBAR amount for display (rounds to 8 decimal places)
 */
export const formatHbar = (hbar: number): string => {
  return hbar.toFixed(8).replace(/\.?0+$/, "");
};
