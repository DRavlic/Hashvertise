import {
  HashConnect,
  HashConnectConnectionState,
  SessionData,
} from "hashconnect";
import { APP_METADATA } from "./constants";
import { WALLET_CONNECT_PROJECT_ID } from "./environment";
import {
  AccountId,
  LedgerId,
  TopicCreateTransaction,
  TopicId,
  TopicMessageSubmitTransaction,
} from "@hashgraph/sdk";
import { showError, showSuccess, getErrorMessage } from "./toast";

let hashconnect: HashConnect | null = null;
let pairingData: SessionData | null = null;
let connectionStatus: HashConnectConnectionState =
  HashConnectConnectionState.Disconnected;
let statusListeners: Array<(status: HashConnectConnectionState) => void> = [];
let pairingListeners: Array<(data: SessionData | null) => void> = [];

export async function initializeHashConnect() {
  try {
    if (!hashconnect) {
      hashconnect = new HashConnect(
        LedgerId.TESTNET, // TO DO: change to proper environment variable
        WALLET_CONNECT_PROJECT_ID,
        {
          name: APP_METADATA.name,
          description: APP_METADATA.description,
          icons: APP_METADATA.icons,
          url: window.location.origin,
        },
        true // TO DO: change to false in production
      );

      hashconnect.pairingEvent.on((newPairing) => {
        pairingData = newPairing as SessionData;
        notifyPairingListeners();

        // Show success notification when paired
        const accountId = getAccountId();
        if (accountId) {
          showSuccess(`Successfully connected to account ${accountId}`);
        } else {
          showSuccess("Successfully connected to wallet");
        }
      });

      hashconnect.disconnectionEvent.on(() => {
        pairingData = null;
        connectionStatus = HashConnectConnectionState.Disconnected;
        notifyStatusListeners();
        notifyPairingListeners();

        showSuccess("Wallet disconnected successfully");
      });

      hashconnect.connectionStatusChangeEvent.on((status) => {
        connectionStatus = status;
        notifyStatusListeners();
      });

      await hashconnect.init();
    }

    return hashconnect;
  } catch (error) {
    showError(
      `Failed to initialize wallet connection: ${getErrorMessage(error)}`
    );
    console.error("HashConnect initialization error:", getErrorMessage(error));
    return null;
  }
}

function notifyStatusListeners() {
  statusListeners.forEach((listener) => listener(connectionStatus));
}

function notifyPairingListeners() {
  pairingListeners.forEach((listener) => listener(pairingData));
}

export async function connectWallet() {
  try {
    if (!hashconnect) {
      showError("Wallet connection not initialized. Please try again.");
      return;
    }
    await hashconnect.openPairingModal();
  } catch (error) {
    showError(`Failed to connect wallet: ${getErrorMessage(error)}`);
    console.error("Connect wallet error:", getErrorMessage(error));
  }
}

export async function disconnectWallet() {
  try {
    if (!hashconnect) {
      showError("Wallet connection not initialized. Please try again.");
      return;
    }
    await hashconnect.disconnect();
  } catch (error) {
    showError(`Failed to disconnect wallet: ${getErrorMessage(error)}`);
    console.error("Disconnect wallet error:", getErrorMessage(error));
  }
}

export function getConnectionStatus() {
  return connectionStatus;
}

export function getPairingData() {
  return pairingData;
}

export function getAccountId() {
  if (
    !pairingData ||
    !pairingData.accountIds ||
    pairingData.accountIds.length === 0
  ) {
    return null;
  }
  return pairingData.accountIds[0];
}

export async function signMessage(message: string) {
  if (!hashconnect || !pairingData) {
    showError("Wallet not connected. Please connect your wallet first.");
    return null;
  }

  const accountId = getAccountId();
  if (!accountId) {
    showError("No account ID found in pairing data.");
    return null;
  }

  try {
    const signer = hashconnect.getSigner(AccountId.fromString(accountId));
    const signatureResult = await signer.sign([Buffer.from(message)]);

    showSuccess("Message signed successfully");

    return Buffer.from(signatureResult[0].signature).toString("base64");
  } catch (error) {
    showError(`Error signing message: ${getErrorMessage(error)}`);
    console.error("Error signing message:", getErrorMessage(error));
    return null;
  }
}

export async function createTopic() {
  if (!hashconnect || !pairingData) {
    showError("Wallet not connected. Please connect your wallet first.");
    return null;
  }

  const accountId = getAccountId();
  if (!accountId) {
    showError("No account ID found in pairing data.");
    return null;
  }

  try {
    const signer = hashconnect.getSigner(AccountId.fromString(accountId));
    const tx = await new TopicCreateTransaction().freezeWithSigner(signer);

    const response = await tx.executeWithSigner(signer);
    const receipt = await response.getReceiptWithSigner(signer);

    showSuccess("Topic created successfully");

    return {
      topicId: receipt.topicId,
      txId: response.transactionId.toString(),
    };
  } catch (error) {
    showError(`Error creating topic: ${getErrorMessage(error)}`);
    console.error("Error creating topic:", getErrorMessage(error));
    return null;
  }
}

export async function submitTopicMessage(message: string, topicId: string) {
  if (!hashconnect || !pairingData) {
    showError("Wallet not connected. Please connect your wallet first.");
    return null;
  }

  const accountId = getAccountId();
  if (!accountId) {
    showError("No account ID found in pairing data.");
    return null;
  }

  try {
    const signer = hashconnect.getSigner(AccountId.fromString(accountId));
    const tx = await new TopicMessageSubmitTransaction()
      .setTopicId(TopicId.fromString(topicId))
      .setMessage(message)
      .freezeWithSigner(signer);

    await tx.executeWithSigner(signer);

    showSuccess("Message submitted successfully");

    return true;
  } catch (error) {
    showError(`Error submitting topic message: ${getErrorMessage(error)}`);
    console.error("Error submitting topic message:", getErrorMessage(error));
    return false;
  }
}

export function subscribeToConnectionStatus(
  listener: (status: HashConnectConnectionState) => void
) {
  statusListeners.push(listener);
  return () => {
    statusListeners = statusListeners.filter((l) => l !== listener);
  };
}

export function subscribeToPairingData(
  listener: (data: SessionData | null) => void
) {
  pairingListeners.push(listener);
  return () => {
    pairingListeners = pairingListeners.filter((l) => l !== listener);
  };
}
