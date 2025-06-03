import dotenv from "dotenv";

// Load environment variables
dotenv.config();

// Server configuration
export const PORT = process.env.PORT || 3200;
export const NODE_ENV = process.env.NODE_ENV || "development";

// Database configuration
export const DB =
  process.env.MONGODB_URI ||
  "mongodb://root:example@localhost:27017/hashvertise?authSource=admin";

// Hedera configuration
export const HEDERA_OPERATOR_ID_ECDSA =
  process.env.HEDERA_OPERATOR_ID_ECDSA || "";
export const HEDERA_OPERATOR_KEY_ECDSA =
  process.env.HEDERA_OPERATOR_KEY_ECDSA || "";
export const HEDERA_NETWORK = process.env.HEDERA_NETWORK || "testnet";

// X configuration
export const TWITTERAPI_USER_ID = process.env.TWITTERAPI_USER_ID || "";
export const TWITTERAPI_API_KEY = process.env.TWITTERAPI_API_KEY || "";

// Smart contract configuration
export const HASHVERTISE_SMART_CONTRACT_ADDRESS =
  process.env.HASHVERTISE_SMART_CONTRACT_ADDRESS || "";
