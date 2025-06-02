import {
  Client,
  TopicId,
  TopicInfoQuery,
  TopicMessageSubmitTransaction,
  TopicMessageQuery,
  TopicMessage,
  SubscriptionHandle,
  AccountId,
  AccountInfoQuery,
  PrivateKey,
  ContractExecuteTransaction,
  ContractFunctionParameters,
  ContractId,
} from "@hashgraph/sdk";
import logger from "./common.instances";
import {
  HEDERA_OPERATOR_ID_ECDSA,
  HEDERA_OPERATOR_KEY_ECDSA,
  HEDERA_NETWORK,
  CHUNK_SIZE,
  MAX_GAS,
  TINYBARS_PER_HBAR,
} from "../environment";
import {
  HEDERA_TESTNET_MIRROR_NODE_URL,
  HEDERA_MIRROR_ACCOUNT_ENDPOINT,
} from "./common.constants";

/**
 * Submit a message to a Hedera consensus topic
 *
 * @param {Client} client - Hedera client instance
 * @param {string} message - Message content to submit to the topic
 * @param {TopicId} topicId - Topic ID to submit to
 */
export const submitMessageToTopic = async (
  client: Client,
  message: string,
  topicId: TopicId
) => {
  try {
    logger.info(
      `Submitting message to Hedera with topic ${topicId.toString()}`
    );

    const topicInfo = await new TopicInfoQuery()
      .setTopicId(topicId)
      .execute(client);

    if (!topicInfo.topicId) {
      logger.error(`Topic with id ${topicId} not found`);
      throw new Error(`Topic with id ${topicId} not found`);
    }

    if (message.length > CHUNK_SIZE) {
      await submitLargeMessageToTopic(client, message, topicId);
    } else {
      await new TopicMessageSubmitTransaction()
        .setTopicId(topicId)
        .setMessage(message)
        .execute(client);
    }
  } catch (error: any) {
    logger.error(`Error submitting message to Hedera: ${error.message}`);
    throw new Error(`Error submitting message to Hedera: ${error.message}`);
  }
};

/**
 * Submits a large message to a topic by breaking it into chunks
 *
 * @param {Client} client - Hedera client instance
 * @param {string} largeMessage - Message content to submit to the topic
 * @param {TopicId} topicId - Topic ID to submit to
 */
export async function submitLargeMessageToTopic(
  client: Client,
  largeMessage: string,
  topicId: TopicId
) {
  const buffer = Buffer.from(largeMessage);
  const totalChunks = Math.ceil(buffer.length / CHUNK_SIZE);

  await new TopicMessageSubmitTransaction()
    .setTopicId(topicId)
    .setMessage(buffer)
    .setMaxChunks(totalChunks)
    .execute(client);
}

/**
 * Sets up a listener for messages on a Hedera topic
 *
 * @param {Client} client - Hedera client instance
 * @param {TopicId} topicId - Topic ID to listen to
 * @param {Function} onMessageCallback - Callback function to handle incoming messages
 * @returns {Promise<SubscriptionHandle | undefined>} The subscription object that can be used to unsubscribe later
 */
export async function setupTopicListener(
  client: Client,
  topicId: TopicId,
  onMessageCallback: (
    topicId: string,
    message: string,
    timestamp: Date
  ) => Promise<void>
): Promise<SubscriptionHandle | undefined> {
  try {
    const subscription = new TopicMessageQuery()
      .setTopicId(topicId)
      .subscribe(client, null, async (message: TopicMessage | null) => {
        if (message) {
          const messageAsString = Buffer.from(message.contents).toString(
            "utf8"
          );

          // Call the callback function if provided
          await onMessageCallback(
            topicId.toString(),
            messageAsString,
            message.consensusTimestamp.toDate()
          ).catch((error) => {
            console.error("Error in message callback function:", error);
          });
        } else {
          console.error("Error when receiving message from subscription");
        }
      });

    return subscription;
  } catch (error: any) {
    console.error("Mirror node error:", error);
    throw new Error(`Error setting up topic listener: ${error.message}`);
  }
}

/**
 * Gets the public key from account ID using Hedera mirror node REST API
 *
 * @param {string} accountId - Account ID to get public key for
 * @returns {Promise<{success: boolean, publicKey?: string, error?: string}>} Result with public key or error
 */
export const getAccountPublicKeyFromMirrorNode = async (
  accountId: string
): Promise<string | null> => {
  try {
    logger.info(
      `Getting public key from mirror node for account: ${accountId}`
    );

    const accountUrl = `${HEDERA_TESTNET_MIRROR_NODE_URL}${HEDERA_MIRROR_ACCOUNT_ENDPOINT}/${accountId}`;
    const response = await fetch(accountUrl);

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    const accountData = await response.json();

    if (accountData && accountData.key && accountData.key.key) {
      return accountData.key.key;
    } else {
      return null;
    }
  } catch (error: any) {
    logger.error(
      `Error getting public key from mirror node for account ${accountId}: ${error.message}`
    );
    return null;
  }
};

/**
 * Gets the EVM address from account ID using Hedera SDK
 *
 * @param {Client} client - Hedera client instance
 * @param {string} accountId - Account ID to get EVM address for
 * @returns {Promise<{success: boolean, evmAddress?: string, error?: string}>} Result with EVM address or error
 */
export const getAccountEvmAddress = async (
  client: Client,
  accountId: string
): Promise<string | null> => {
  try {
    logger.info(`Getting EVM address for account: ${accountId}`);

    const accountInfo = await new AccountInfoQuery()
      .setAccountId(AccountId.fromString(accountId))
      .execute(client);

    if (accountInfo.contractAccountId) {
      return accountInfo.contractAccountId;
    } else {
      return null;
    }
  } catch (error: any) {
    logger.error(
      `Error getting EVM address for account ${accountId}: ${error.message}`
    );
    return null;
  }
};

/**
 * Gets the public key from account ID
 *
 * @param {Client} client - Hedera client instance
 * @param {AccountId} accountId - Account ID to get public key for
 * @returns {Promise<string>} The public key of the account
 */
export const getAccountPublicKey = async (
  client: Client,
  accountId: AccountId
): Promise<string> => {
  try {
    const query = new AccountInfoQuery().setAccountId(accountId);
    const info = await query.execute(client);

    return info.key.toString();
  } catch (error: any) {
    logger.error(
      `Error getting public key for account ${accountId}: ${error.message}`
    );
    throw new Error(
      `Error getting public key for account ${accountId}: ${error.message}`
    );
  }
};

/**
 * Signs a message with a private key of client operator
 *
 * @param {string} message - Message to sign
 * @returns {string} The signature of the message
 */
export const signMessage = (message: string): string => {
  try {
    if (!HEDERA_OPERATOR_KEY_ECDSA) {
      throw new Error(
        "HEDERA_OPERATOR_KEY_ECDSA must be set in environment variables"
      );
    }

    const privKey = PrivateKey.fromStringECDSA(HEDERA_OPERATOR_KEY_ECDSA);
    const messageBytes = Buffer.from(message);
    const signature = privKey.sign(messageBytes);

    return Buffer.from(signature).toString("hex");
  } catch (error: any) {
    logger.error(`Error signing message: ${error.message}`);
    return "";
  }
};

/**
 * Verifies a signature of a message with a public key
 *
 * @param {string} message - Message to verify
 * @param {string} signature - Signature to verify
 * @returns {boolean} Whether the signature is valid
 */
export const verifySignature = (
  message: string,
  signature: string
): boolean => {
  try {
    if (!HEDERA_OPERATOR_KEY_ECDSA) {
      throw new Error(
        "HEDERA_OPERATOR_KEY_ECDSA must be set in environment variables"
      );
    }

    const privKey = PrivateKey.fromStringECDSA(HEDERA_OPERATOR_KEY_ECDSA);
    const pubKey = privKey.publicKey;
    const messageBytes = Buffer.from(message);
    const signatureBytes = Buffer.from(signature, "hex");

    const isValid = pubKey.verify(messageBytes, signatureBytes);

    return isValid;
  } catch (error: any) {
    logger.error(`Error verifying signature: ${error.message}`);
    return false;
  }
};

/**
 * Initialize a Hedera client with the configured credentials
 *
 * @returns {Client} Configured Hedera client instance
 * @throws {Error} If required environment variables are not set
 */
export const initializeHederaClient = (): Client => {
  // Create network-appropriate client
  const client =
    HEDERA_NETWORK === "mainnet" ? Client.forMainnet() : Client.forTestnet();

  if (!HEDERA_OPERATOR_ID_ECDSA || !HEDERA_OPERATOR_KEY_ECDSA) {
    throw new Error(
      "HEDERA_OPERATOR_ID_ECDSA and HEDERA_OPERATOR_KEY_ECDSA must be set in environment variables"
    );
  }

  const operatorAccountId = AccountId.fromString(HEDERA_OPERATOR_ID_ECDSA);
  const operatorPrivateKey = PrivateKey.fromStringECDSA(
    HEDERA_OPERATOR_KEY_ECDSA
  );

  client.setOperator(operatorAccountId, operatorPrivateKey);
  logger.info(`Initialized Hedera client for ${HEDERA_NETWORK}`);

  return client;
};

/**
 * Distributes prizes to participants through the Hashvertise smart contract
 *
 * @param {Client} client - Hedera client instance
 * @param {string} contractAddress - The smart contract address (Hedera format or 0x format)
 * @param {string} advertiserEvmAddress - The advertiser's EVM address
 * @param {string} topicId - The topic ID
 * @param {string[]} participantEvmAddresses - Array of participant EVM addresses
 * @param {number[]} amounts - Array of amounts in HBAR
 * @returns {Promise<{success: boolean, transactionId?: string, error?: string}>} Distribution result
 */
export const distributePrizeToParticipants = async (
  client: Client,
  contractAddress: string,
  advertiserEvmAddress: string,
  topicId: string,
  participantEvmAddresses: string[],
  amounts: number[]
): Promise<string | null> => {
  try {
    if (!HEDERA_OPERATOR_KEY_ECDSA) {
      throw new Error(
        "HEDERA_OPERATOR_KEY_ECDSA must be set in environment variables"
      );
    }

    logger.info(
      `Starting smart contract prize distribution for topic: ${topicId}`
    );

    const operatorKey = PrivateKey.fromStringECDSA(HEDERA_OPERATOR_KEY_ECDSA);

    // Handle contract address format (0x vs Hedera format)
    let contractId: ContractId;
    if (contractAddress.startsWith("0x")) {
      // Convert Ethereum address to Hedera Contract ID format
      contractId = ContractId.fromEvmAddress(0, 0, contractAddress); // TO DO: handle shard and realm properly
    } else {
      // Assume it's already in Hedera format
      contractId = ContractId.fromString(contractAddress);
    }

    // Convert HBAR amounts to tinybars for smart contract
    const amountsInTinybars = amounts.map((amount) =>
      Math.floor(amount * TINYBARS_PER_HBAR)
    );

    // Prepare function parameters
    const functionParams = new ContractFunctionParameters()
      .addAddress(advertiserEvmAddress)
      .addString(topicId)
      .addAddressArray(participantEvmAddresses)
      .addUint256Array(amountsInTinybars);

    // Execute the contract call
    const contractExecTx = new ContractExecuteTransaction()
      .setContractId(contractId)
      .setFunction("distributePrize", functionParams)
      .setGas(MAX_GAS)
      .freezeWith(client);

    const contractSignedTx = await contractExecTx.sign(operatorKey);
    const contractResponse = await contractSignedTx.execute(client);
    const contractReceipt = await contractResponse.getReceipt(client);

    const transactionId = contractResponse.transactionId.toString();

    logger.info(
      `Smart contract prize distribution completed. Status: ${contractReceipt.status.toString()}, Transaction ID: ${transactionId}`
    );

    return transactionId;
  } catch (error: any) {
    logger.error(
      `Error executing smart contract prize distribution: ${error.message}`
    );
    return null;
  }
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
