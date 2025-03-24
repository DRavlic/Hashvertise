import { z } from "zod";
import { DEFAULT_TOPIC_MESSAGES_LIMIT } from "./topic.constants";

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

// Schema for getting topic messages
export const topicMessagesSchema = z.object({
  params: z.object({
    topicId: z.string({
      required_error: "Topic ID is required",
    }),
  }),
  query: z
    .object({
      limit: z
        .string()
        .optional()
        .transform((val) =>
          val ? parseInt(val, 10) : DEFAULT_TOPIC_MESSAGES_LIMIT
        ),
    })
    .optional(),
});

// Schema for deactivating a topic listener
export const topicDeactivateSchema = z.object({
  params: z.object({
    topicId: z.string({
      required_error: "Topic ID is required",
    }),
  }),
});
