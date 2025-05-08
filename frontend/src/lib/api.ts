import { API_URL } from "./environment";
import { getErrorMessage } from "./toast";

/**
 * Register a topic listener with the backend
 * @param topicId The topic ID to listen to
 */
export async function registerTopicListener(
  topicId: string
): Promise<{ success: boolean; message?: string; error?: string }> {
  try {
    const response = await fetch(`${API_URL}/topic/listen`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ topicId }),
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: data.error || "Failed to register topic listener",
      };
    }

    return {
      success: true,
      message: data.message,
    };
  } catch (error) {
    console.error("Error registering topic listener:", getErrorMessage(error));
    return {
      success: false,
      error: getErrorMessage(error),
    };
  }
}

/**
 * Submit a consensus message directly to the backend API
 */
export async function submitConsensusMessage(
  network: "testnet" | "mainnet",
  accountId: string,
  message: string,
  topicId?: string
): Promise<string | undefined> {
  try {
    const endpoint = `${API_URL}/consensus/submit`;

    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        network,
        accountId,
        message,
        topicId,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to submit message: ${error}`);
    }

    const data = await response.json();
    return data.topicId;
  } catch (error) {
    console.error(
      "Error submitting consensus message:",
      getErrorMessage(error)
    );
    return undefined;
  }
}
