import { z } from "zod";

// Schema for user validation
export const validateUserSchema = z.object({
  body: z.object({
    accountId: z
      .string({
        required_error: "Account ID is required",
      })
      .min(1, "Account ID cannot be empty"),
    xHandle: z.string().optional(),
  }),
});
