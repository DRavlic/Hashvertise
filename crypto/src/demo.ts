import { Client, AccountBalanceQuery } from "@hashgraph/sdk";
import { HEDERA_OPERATOR_ID, HEDERA_OPERATOR_KEY } from "./environment";
import { setupTopicListener, submitConsensusMessage } from "./consensusService";

// Demo function for testing
async function demo() {
  if (!HEDERA_OPERATOR_ID || !HEDERA_OPERATOR_KEY) {
    console.error(
      "Please set HEDERA_OPERATOR_ID and HEDERA_OPERATOR_KEY in environment variables"
    );
    return;
  }

  // Create a client for the testnet
  const client = Client.forTestnet();
  client.setOperator(HEDERA_OPERATOR_ID, HEDERA_OPERATOR_KEY);

  try {
    const accountBalance = await new AccountBalanceQuery()
      .setAccountId(HEDERA_OPERATOR_ID)
      .execute(client);
    console.log(`Account balance: ${accountBalance.hbars.toString()}`);

    // Create a topic first
    const topicId = await submitConsensusMessage(client, "Initial message");

    if (topicId) {
      // Setup listener before sending another message
      await setupTopicListener(client, topicId);

      // Test large message (1400 bytes = 2 chunks)
      const largeMessage = `START-${"-".repeat(1400)}-END`; // message 1400 bytes

      // Submit large message with chunking
      await submitConsensusMessage(client, largeMessage, topicId);
    }
  } catch (error) {
    console.error("Error:", error);
  }
}

// Run the demo
demo();
