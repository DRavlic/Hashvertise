import { z } from "zod";
import {
  DEFAULT_TOPIC_MESSAGES_LIMIT,
  DEFAULT_PAGE,
  DEFAULT_CAMPAIGNS_LIMIT,
} from "./topic.constants";

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

// Schema for campaign verification
export const campaignVerifySchema = z.object({
  body: z.object({
    message: z.string({
      required_error: "Message is required",
    }),
    signature: z.string({
      required_error: "Signature is required",
    }),
  }),
});

// Campaigns list schema with pagination
export const campaignsListSchema = z.object({
  query: z
    .object({
      page: z
        .string()
        .optional()
        .transform((val) => (val ? parseInt(val, 10) : DEFAULT_PAGE)),
      limit: z
        .string()
        .optional()
        .transform((val) =>
          val ? parseInt(val, 10) : DEFAULT_CAMPAIGNS_LIMIT
        ),
    })
    .optional(),
});

// Schema for topic message verification
export const topicMessageVerifySchema = z.object({
  body: z.object({
    message: z.string({
      required_error: "Message is required",
    }),
    signature: z.string({
      required_error: "Signature is required",
    }),
  }),
});

// Schema for getting a campaign by topic ID
export const campaignGetSchema = z.object({
  params: z.object({
    topicId: z.string({
      required_error: "Topic ID is required",
    }),
  }),
});
