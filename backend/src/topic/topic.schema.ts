import { z } from "zod";

// Schema for setting up a topic listener
export const topicListenSchema = z.object({
  body: z.object({
    topicId: z.string({
      required_error: "Topic ID is required",
    }),
  }),
});

// Schema for checking topic status
export const topicStatusSchema = z.object({
  params: z.object({
    topicId: z.string({
      required_error: "Topic ID is required",
    }),
  }),
});
