import { createContext } from "react";
import { HashConnectConnectionState } from "hashconnect";

type WalletContextType = {
  connectionStatus: HashConnectConnectionState;
  pairingData: unknown | null;
  connectWallet: () => Promise<void>;
  disconnectWallet: () => Promise<void>;
};

export const WalletContext = createContext<WalletContextType | undefined>(
  undefined
);
