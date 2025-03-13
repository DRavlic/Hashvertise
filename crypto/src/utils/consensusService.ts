import {
    Client,
    TopicCreateTransaction,
    TopicMessageSubmitTransaction,
    TopicId,
    TopicMessageQuery,
    TopicMessage,
  } from "@hashgraph/sdk";
  import { CHUNK_SIZE } from "../environment";
  
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
        console.log(`Created new topic ${topicId}`);
      }
  
      // Submit (large) message to the topic
      if (message.length > CHUNK_SIZE) {
        await submitLargeMessage(client, message, topicId);
      } else {
        await new TopicMessageSubmitTransaction()
          .setTopicId(topicId)
          .setMessage(message)
          .execute(client);
  
        console.log(`Message submitted to ${topicId}: ${message}`);
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
  
    console.log(`Large message submitted to ${topicId}: ${largeMessage}`);
  }
  
  /**
   * Sets up a listener for messages on a Hedera topic
   * @param client Hedera client
   * @param topicId Topic ID to listen to
   */
  export async function setupTopicListener(client: Client, topicId: TopicId) {
    try {
      // Wait for mirror node to sync with main network
      await new Promise(resolve => setTimeout(resolve, 5000));
  
      new TopicMessageQuery()
        .setTopicId(topicId)
        .subscribe(client, null, (message: TopicMessage | null) => {
          if (message) {
            const messageAsString = Buffer.from(message.contents).toString(
              "utf8"
            );
            console.log(
              `${message.consensusTimestamp.toDate()} Received: ${messageAsString}`
            );
          } else {
            console.error("Error in subscription");
          }
        });
    } catch (error) {
      console.error("Mirror node error:", error);
    }
  }