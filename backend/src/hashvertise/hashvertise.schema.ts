import { z } from "zod";
import {
  HASHVERTISE_MIN_FEE_BASIS_POINTS,
  HASHVERTISE_MAX_FEE_BASIS_POINTS,
  HASHVERTISE_MIN_DEPOSIT_TINYBARS,
} from "../environment";

// Schema for getting config (no validation needed - GET endpoint with no params)
export const getConfigSchema = z.object({});

// Schema for updating Hashvertise configuration
export const updateConfigSchema = z.object({
  body: z.object({
    feeBasisPoints: z
      .number({
        required_error: "feeBasisPoints is required",
      })
      .int("feeBasisPoints must be an integer")
      .min(
        HASHVERTISE_MIN_FEE_BASIS_POINTS,
        `feeBasisPoints must be at least ${HASHVERTISE_MIN_FEE_BASIS_POINTS}`
      )
      .max(
        HASHVERTISE_MAX_FEE_BASIS_POINTS,
        `feeBasisPoints must not exceed ${HASHVERTISE_MAX_FEE_BASIS_POINTS}`
      ),
    minimumDepositInTinybars: z
      .number({
        required_error: "minimumDepositInTinybars is required",
      })
      .int("minimumDepositInTinybars must be an integer")
      .min(
        HASHVERTISE_MIN_DEPOSIT_TINYBARS,
        `minimumDepositInTinybars must be at least ${HASHVERTISE_MIN_DEPOSIT_TINYBARS} tinybars (1 HBAR)`
      ),
    contractAddress: z
      .string({
        required_error: "contractAddress is required",
      })
      .min(1, "contractAddress cannot be empty")
      .trim(),
  }),
});
