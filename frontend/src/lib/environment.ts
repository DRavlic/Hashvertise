import dotenv from "dotenv";

// Load environment variables
dotenv.config();

// Wallet Connect Project ID configuration
export const WALLET_CONNECT_PROJECT_ID =
  process.env.VITE_WALLET_CONNECT_PROJECT_ID || "";

// API URL configuration
export const API_URL = process.env.VITE_API_URL || "http://localhost:3200/api";

// API endpoints
export const API_ENDPOINTS = {
  VERIFY_CAMPAIGN: `${API_URL}/topic/campaign/verify`,
};
