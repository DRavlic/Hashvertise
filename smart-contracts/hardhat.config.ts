import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import * as dotenv from "dotenv";

dotenv.config();

// ECDSA accounts only
const HEDERA_TESTNET_PRIVATE_KEY =
  process.env.HEDERA_TESTNET_PRIVATE_KEY ||
  "0000000000000000000000000000000000000000000000000000000000000000";
const HEDERA_MAINNET_PRIVATE_KEY =
  process.env.HEDERA_MAINNET_PRIVATE_KEY ||
  "0000000000000000000000000000000000000000000000000000000000000000";

const HEDERA_TESTNET_JSON_RPC_RELAY_URL =
  process.env.HEDERA_TESTNET_JSON_RPC_RELAY_URL ||
  "https://testnet.hashio.io/api";
const HEDERA_MAINNET_JSON_RPC_RELAY_URL =
  process.env.HEDERA_MAINNET_JSON_RPC_RELAY_URL ||
  "https://mainnet.hashio.io/api";

const config: HardhatUserConfig = {
  solidity: "0.8.28",
  defaultNetwork: "hederaTestnet",
  networks: {
    hederaTestnet: {
      url: HEDERA_TESTNET_JSON_RPC_RELAY_URL,
      accounts: [HEDERA_TESTNET_PRIVATE_KEY],
      chainId: 296,
    },
    hederaMainnet: {
      url: HEDERA_MAINNET_JSON_RPC_RELAY_URL,
      accounts: [HEDERA_MAINNET_PRIVATE_KEY],
      chainId: 295,
    },
  },
};

export default config;
