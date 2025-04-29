import { createContext } from "react";
import { HashConnectConnectionState, SessionData } from "hashconnect";

type WalletContextType = {
  connectionStatus: HashConnectConnectionState;
  pairingData: SessionData | null;
  accountId: string | null;
  connectWallet: () => Promise<void>;
  disconnectWallet: () => Promise<void>;
  signMessage: (message: string) => Promise<unknown | null>;
};

export const WalletContext = createContext<WalletContextType | undefined>(
  undefined
);
