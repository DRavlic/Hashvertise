import { z } from "zod";
import {
  DEFAULT_TOPIC_MESSAGES_LIMIT,
  DEFAULT_PAGE,
  DEFAULT_CAMPAIGNS_LIMIT,
  MAX_CAMPAIGN_NAME_LENGTH,
  MAX_REQUIREMENT_LENGTH,
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

// Schema for campaign verification
export const campaignVerifySchema = z.object({
  body: z.object({
    message: z
      .string({
        required_error: "Message is required",
      })
      .refine(
        (message) => {
          // Extract campaign name and requirement from the message
          // Message format: "txId, topicId, name, accountId, prizePool, requirement, startDate, endDate"
          const parts = message.split(", ");
          if (parts.length < 8) return false;

          const name = parts[2];
          const requirement = parts[5];

          return (
            name.length <= MAX_CAMPAIGN_NAME_LENGTH &&
            requirement.length <= MAX_REQUIREMENT_LENGTH
          );
        },
        {
          message: `Campaign name must not exceed ${MAX_CAMPAIGN_NAME_LENGTH} characters and requirement must not exceed ${MAX_REQUIREMENT_LENGTH} characters.`,
        }
      ),
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

// Schema for getting a campaign by topic ID
export const campaignGetSchema = z.object({
  params: z.object({
    topicId: z.string({
      required_error: "Topic ID is required",
    }),
  }),
});

// Schema for getting campaign results by topic ID
export const campaignResultsGetSchema = z.object({
  params: z.object({
    topicId: z.string({
      required_error: "Topic ID is required",
    }),
  }),
});
