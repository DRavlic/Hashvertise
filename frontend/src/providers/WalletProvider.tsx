import { useState, useEffect, type ReactNode } from "react";
import { WalletContext } from "./WalletContext";
import {
  initializeHashConnect,
  connectWallet,
  disconnectWallet,
  getConnectionStatus,
  getPairingData,
  subscribeToConnectionStatus,
  subscribeToPairingData,
} from "../lib/wallet";
import { HashConnectConnectionState } from "hashconnect";

export function WalletProvider({ children }: { children: ReactNode }) {
  const [connectionStatus, setConnectionStatus] =
    useState<HashConnectConnectionState>(
      HashConnectConnectionState.Disconnected
    );
  const [pairingData, setPairingData] = useState<unknown | null>(null);

  useEffect(() => {
    const init = async () => {
      await initializeHashConnect();

      // Initial state
      setConnectionStatus(getConnectionStatus());
      setPairingData(getPairingData());

      // Subscribe to changes
      const unsubscribeStatus = subscribeToConnectionStatus((status) => {
        setConnectionStatus(status);
      });

      const unsubscribePairing = subscribeToPairingData((data) => {
        setPairingData(data);
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

  return (
    <WalletContext.Provider
      value={{
        connectionStatus,
        pairingData,
        connectWallet: handleConnect,
        disconnectWallet: handleDisconnect,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
}
