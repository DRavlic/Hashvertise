import { z } from "zod";
import { MIN_USERNAME_LENGTH, MAX_USERNAME_LENGTH } from "./x.constants";

export const getUserTweetsSchema = z.object({
  params: z.object({
    userName: z.string().min(MIN_USERNAME_LENGTH).max(MAX_USERNAME_LENGTH),
  }),
  query: z.object({
    cursor: z.string().optional(),
  }),
});
