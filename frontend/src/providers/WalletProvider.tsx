import { useState, useEffect, type ReactNode } from "react";
import { WalletContext } from "./WalletContext";
import {
  initializeHashConnect,
  connectWallet,
  disconnectWallet,
  getConnectionStatus,
  getPairingData,
  getAccountId,
  signMessage,
  subscribeToConnectionStatus,
  subscribeToPairingData,
} from "../lib/wallet";
import { HashConnectConnectionState, SessionData } from "hashconnect";

export function WalletProvider({ children }: { children: ReactNode }) {
  const [connectionStatus, setConnectionStatus] =
    useState<HashConnectConnectionState>(
      HashConnectConnectionState.Disconnected
    );
  const [pairingData, setPairingData] = useState<SessionData | null>(null);
  const [accountId, setAccountId] = useState<string | null>(null);

  useEffect(() => {
    const init = async () => {
      await initializeHashConnect();

      // Initial state
      setConnectionStatus(getConnectionStatus());
      setPairingData(getPairingData());
      setAccountId(getAccountId());

      // Subscribe to changes
      const unsubscribeStatus = subscribeToConnectionStatus((status) => {
        setConnectionStatus(status);
      });

      const unsubscribePairing = subscribeToPairingData((data) => {
        setPairingData(data);
        setAccountId(getAccountId());
      });

      return () => {
        unsubscribeStatus();
        unsubscribePairing();
      };
    };

    init();
  }, []);

  const handleConnect = async () => {
    await connectWallet();
  };

  const handleDisconnect = async () => {
    await disconnectWallet();
  };

  const handleSignMessage = async (message: string) => {
    const result = await signMessage(message);
    return result;
  };

  return (
    <WalletContext.Provider
      value={{
        connectionStatus,
        pairingData,
        accountId,
        connectWallet: handleConnect,
        disconnectWallet: handleDisconnect,
        signMessage: handleSignMessage,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
}
