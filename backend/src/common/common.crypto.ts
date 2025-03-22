import { Client } from "@hashvertise/crypto";
import logger from "./common.instances";
import {
  HEDERA_OPERATOR_ID,
  HEDERA_OPERATOR_KEY,
  HEDERA_NETWORK,
} from "../environment";

/**
 * Initialize a Hedera client with the configured credentials
 */
export const initializeHederaClient = (): Client => {
  // Create network-appropriate client
  const client =
    HEDERA_NETWORK === "mainnet" ? Client.forMainnet() : Client.forTestnet();

  if (!HEDERA_OPERATOR_ID || !HEDERA_OPERATOR_KEY) {
    throw new Error(
      "HEDERA_OPERATOR_ID and HEDERA_OPERATOR_KEY must be set in environment variables"
    );
  }

  client.setOperator(HEDERA_OPERATOR_ID, HEDERA_OPERATOR_KEY);
  logger.info(`Initialized Hedera client for ${HEDERA_NETWORK}`);

  return client;
};

// Create and export a singleton Hedera client
let hederaClient: Client;

try {
  hederaClient = initializeHederaClient();
  logger.info("Hedera client initialized successfully");
} catch (error) {
  logger.error("Failed to initialize Hedera client:", error);
  process.exit(1);
}

export { hederaClient };
