// Wallet Connect Project ID configuration
export const WALLET_CONNECT_PROJECT_ID =
  import.meta.env.VITE_WALLET_CONNECT_PROJECT_ID || "";

// API URL configuration
export const API_URL =
  import.meta.env.VITE_API_URL || "http://localhost:3200/api";

// Smart contract configuration
export const HASHVERTISE_SMART_CONTRACT_ADDRESS =
  import.meta.env.VITE_HASHVERTISE_SMART_CONTRACT_ADDRESS || "";
export const MAX_GAS = 1000000;

// API endpoints
export const API_ENDPOINTS = {
  VALIDATE_USER: `${API_URL}/user/validate`,
  VERIFY_CAMPAIGN: `${API_URL}/topic/campaign/verify`,
  GET_CAMPAIGNS: `${API_URL}/topic/campaigns`,
  GET_CAMPAIGN: (topicId: string) => `${API_URL}/topic/campaign/${topicId}`,
  GET_TOPIC_MESSAGES: (topicId: string) =>
    `${API_URL}/topic/messages/${topicId}`,
  VERIFY_TOPIC_MESSAGE: `${API_URL}/topic/message/verify`,
};
