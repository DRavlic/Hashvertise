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
