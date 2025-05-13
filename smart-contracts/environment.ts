import * as dotenv from "dotenv";

dotenv.config();

// ECDSA account needed for deployment
export const TESTNET_PRIVATE_KEY =
  process.env.TESTNET_PRIVATE_KEY ||
  "0000000000000000000000000000000000000000000000000000000000000000";
export const TESTNET_ACCOUNT_ID = process.env.TESTNET_ACCOUNT_ID || "0.0.0";

// ECDSA account needed for deployment
export const MAINNET_PRIVATE_KEY =
  process.env.MAINNET_PRIVATE_KEY ||
  "0000000000000000000000000000000000000000000000000000000000000000";
export const MAINNET_ACCOUNT_ID = process.env.MAINNET_ACCOUNT_ID || "0.0.0";

export const TESTNET_JSON_RPC_RELAY_URL =
  process.env.TESTNET_JSON_RPC_RELAY_URL || "https://testnet.hashio.io/api";
export const MAINNET_JSON_RPC_RELAY_URL =
  process.env.MAINNET_JSON_RPC_RELAY_URL || "https://mainnet.hashio.io/api";

export const MAX_GAS = 1000000;
