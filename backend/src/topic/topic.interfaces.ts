/**
 * Response for topic status check
 */
export interface TopicStatusResponse {
  topicId: string;
  isActive: boolean;
}

/**
 * Response for setting up a topic listener
 */
export interface TopicListenResponse {
  success: boolean;
  message?: string;
  error?: string;
  details?: string;
}

/**
 * Parsed campaign data from a message
 */
export interface ParsedCampaignData {
  txId: string;
  topicId: string;
  name: string;
  accountId: string;
  prizePool: number;
  requirement: string;
}

/**
 * Parsed topic message data
 */
export interface ParsedTopicMessageData {
  accountId: string;
  XHandle: string;
}
