export const DEFAULT_TOPIC_MESSAGES_LIMIT = 50;

export interface TopicStatusResponse {
    topicId: string;
    isActive: boolean;
  }

export interface TopicListenResponse {
  success: boolean;
  message?: string;
  error?: string;
  details?: string;
}
