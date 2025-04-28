/**
 * Request body for submitting a consensus message
 */
export interface SubmitMessageRequest {
  network: "testnet" | "mainnet";
  accountId: string;
  message: string;
  topicId?: string;
}

/**
 * Response for consensus message submission
 */
export interface SubmitMessageResponse {
  success: boolean;
  topicId?: string;
  error?: string;
  details?: any; // Can be string or validation errors
}
