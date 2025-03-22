import {
  Client,
  TopicCreateTransaction,
  TopicMessageSubmitTransaction,
  TopicId,
  TopicMessageQuery,
  TopicMessage,
} from "@hashgraph/sdk";
import { CHUNK_SIZE } from "./environment";

/**
 * Submits a consensus message to a Hedera topic
 * @param client Hedera client
 * @param message Message to submit
 * @param topicId Optional existing topic ID
 * @returns The topic ID used or created
 */
export async function submitConsensusMessage(
  client: Client,
  message: string,
  topicId?: TopicId
): Promise<TopicId | undefined> {
  try {
    // Create a new topic if none provided
    if (!topicId) {
      const createTx = await new TopicCreateTransaction().execute(client);
      const createRx = await createTx.getReceipt(client);
      topicId = createRx.topicId!;
    }

    // Submit (large) message to the topic
    if (message.length > CHUNK_SIZE) {
      await submitLargeMessage(client, message, topicId);
    } else {
      await new TopicMessageSubmitTransaction()
        .setTopicId(topicId)
        .setMessage(message)
        .execute(client);

      return topicId;
    }
  } catch (error) {
    console.error("Consensus service error:", error);
    return undefined;
  }
}

/**
 * Submits a large message to a topic by breaking it into chunks
 * @param client Hedera client
 * @param largeMessage The large message to submit
 * @param topicId The topic ID to submit to
 */
export async function submitLargeMessage(
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
 * @param client Hedera client
 * @param topicId Topic ID to listen to
 * @param onMessageCallback Optional callback function to handle incoming messages
 */
export async function setupTopicListener(
  client: Client,
  topicId: TopicId,
  onMessageCallback?: (
    topicId: string,
    message: string,
    timestamp: Date
  ) => Promise<void>
) {
  try {
    // Wait for mirror node to sync with main network
    await new Promise((resolve) => setTimeout(resolve, 5000));

    new TopicMessageQuery()
      .setTopicId(topicId)
      .subscribe(client, null, async (message: TopicMessage | null) => {
        if (message) {
          const messageAsString = Buffer.from(message.contents).toString(
            "utf8"
          );

          // Call the callback function if provided
          if (onMessageCallback) {
            await onMessageCallback(
              topicId.toString(),
              messageAsString,
              message.consensusTimestamp.toDate()
            ).catch((error) => {
              console.error("Error in message callback:", error);
            });
          }
        } else {
          console.error("Error in subscription");
        }
      });
  } catch (error) {
    console.error("Mirror node error:", error);
  }
}
