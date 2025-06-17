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

export const MAX_GAS = 1_000_000;
export const TINYBARS_PER_HBAR = 100_000_000; // 1 HBAR = 100,000,000 tinybars

export const ABSOLUTE_MINIMUM_DEPOSIT = 100_000_000; // 1 HBAR = 100,000,000 tinybars
export const HASHVERTISE_FEE_BASIS_POINTS = parseInt(
  process.env.HASHVERTISE_FEE_BASIS_POINTS || "100"
); // 1% = 100 basis points
export const HASHVERTISE_MINIMUM_DEPOSIT = parseInt(
  process.env.HASHVERTISE_MINIMUM_DEPOSIT || "100000000"
); // 1 HBAR = 100,000,000 tinybars
