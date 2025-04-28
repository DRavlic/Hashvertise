// Environment and app-wide constants
export const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

export const WALLET_CONNECT_PROJECT_ID =
  import.meta.env.VITE_WALLET_CONNECT_PROJECT_ID || "";

export const APP_METADATA = {
  name: "Hashvertise",
  description: "Decentralized advertising on Hedera network",
  url: "https://hashvertise.app",
  icons: ["https://hashvertise.app/logo.png"],
};
