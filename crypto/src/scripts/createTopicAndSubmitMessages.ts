import { Client } from "@hashgraph/sdk";
import * as readline from "readline";
import { HEDERA_OPERATOR_ID, HEDERA_OPERATOR_KEY } from "../environment";
import { submitConsensusMessage } from "../consensusService";

async function createTopicAndSubmitMessages() {
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
    // Create a new topic and submit initial message
    const topicId = await submitConsensusMessage(client, "Topic initialized");

    if (!topicId) {
      console.error("Failed to create topic");
      return;
    }

    console.log(`\nTopic created successfully with ID: ${topicId.toString()}`);
    console.log(
      "You can now submit messages to this topic. Press Ctrl+C to exit."
    );

    // Create readline interface for user input
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    // Function to prompt for message and submit
    const promptAndSubmit = () => {
      rl.question("\nEnter message to submit: ", async (message) => {
        if (message.trim()) {
          await submitConsensusMessage(client, message, topicId);
        } else {
          console.log("\nEmpty message, not submitted");
        }
        // Continue prompting
        promptAndSubmit();
      });
    };

    // Start the prompt loop
    promptAndSubmit();
  } catch (error) {
    console.error("Error:", error);
  }
}

// Run the script
createTopicAndSubmitMessages();
