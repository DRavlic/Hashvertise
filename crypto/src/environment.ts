import dotenv from "dotenv";
dotenv.config();

export const CHUNK_SIZE = 1024; // 1KB

export const HEDERA_OPERATOR_ID: string = process.env.HEDERA_OPERATOR_ID || "";
export const HEDERA_OPERATOR_KEY: string =
  process.env.HEDERA_OPERATOR_KEY || "";
export const HEDERA_NETWORK: string = process.env.HEDERA_NETWORK || "testnet";
