import { HASHSCAN_URLS } from "./constants";
import { LedgerId } from "@hashgraph/sdk";

/**
 * Generates a Hashscan URL for a topic
 *
 * @param topicId - The topic ID to generate a URL for
 * @param ledgerId - The ledger ID (MAINNET or TESTNET)
 * @returns URL to the topic on Hashscan
 */
export function getHashscanTopicUrl(
  topicId: string,
  ledgerId: LedgerId | null
): string {
  const baseUrl =
    ledgerId === LedgerId.MAINNET
      ? HASHSCAN_URLS.MAINNET
      : HASHSCAN_URLS.TESTNET;

  return `${baseUrl}/topic/${topicId}`;
}
