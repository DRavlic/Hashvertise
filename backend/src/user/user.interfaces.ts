/**
 * Response interface for user validation
 */
export interface UserValidationResponse {
  success: boolean;
  message?: string;
  user?: {
    accountId: string;
    publicKey: string;
    evmAddress: string;
  };
  error?: string;
}
