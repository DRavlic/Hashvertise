import { HashConnect, HashConnectConnectionState } from "hashconnect";
import { APP_METADATA, WALLET_CONNECT_PROJECT_ID } from "./constants";
import { LedgerId } from "@hashgraph/sdk";

let hashconnect: HashConnect | null = null;
let pairingData: unknown | null = null;
let connectionStatus: HashConnectConnectionState =
  HashConnectConnectionState.Disconnected;
let statusListeners: Array<(status: HashConnectConnectionState) => void> = [];
let pairingListeners: Array<(data: unknown | null) => void> = [];

export async function initializeHashConnect() {
  if (!hashconnect) {
    hashconnect = new HashConnect(
      LedgerId.TESTNET,
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
      pairingData = newPairing;
      notifyPairingListeners();
    });

    hashconnect.disconnectionEvent.on(() => {
      pairingData = null;
      connectionStatus = HashConnectConnectionState.Disconnected;
      notifyStatusListeners();
      notifyPairingListeners();
    });

    hashconnect.connectionStatusChangeEvent.on((status) => {
      connectionStatus = status;
      notifyStatusListeners();
    });

    await hashconnect.init();
  }

  return hashconnect;
}

function notifyStatusListeners() {
  statusListeners.forEach((listener) => listener(connectionStatus));
}

function notifyPairingListeners() {
  pairingListeners.forEach((listener) => listener(pairingData));
}

export async function connectWallet() {
  if (!hashconnect) return;
  await hashconnect.openPairingModal();
}

export async function disconnectWallet() {
  if (!hashconnect) return;
  await hashconnect.disconnect();
}

export function getConnectionStatus() {
  return connectionStatus;
}

export function getPairingData() {
  return pairingData;
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
  listener: (data: unknown | null) => void
) {
  pairingListeners.push(listener);
  return () => {
    pairingListeners = pairingListeners.filter((l) => l !== listener);
  };
}
