import { z } from "zod";
import { MIN_USERNAME_LENGTH, MAX_USERNAME_LENGTH } from "./x.constants";

export const getUserTweetsSchema = z.object({
  params: z.object({
    xHandle: z.string().min(MIN_USERNAME_LENGTH).max(MAX_USERNAME_LENGTH),
  }),
  query: z.object({
    cursor: z.string().optional(),
  }),
});

export const getUserInfoSchema = z.object({
  params: z.object({
    xHandle: z.string().min(MIN_USERNAME_LENGTH).max(MAX_USERNAME_LENGTH),
  }),
});

export const distributeRewardSchema = z.object({
  params: z.object({
    topicId: z.string({
      required_error: "Topic ID is required",
    }),
  }),
});
