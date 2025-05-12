import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import {
  HEDERA_TESTNET_JSON_RPC_RELAY_URL,
  HEDERA_MAINNET_JSON_RPC_RELAY_URL,
  HEDERA_TESTNET_PRIVATE_KEY,
  HEDERA_MAINNET_PRIVATE_KEY,
} from "./environment";

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
  paths: {
    sources: "./src/contracts",
    tests: "./src/test",
    cache: "./hardhat-files/cache",
    artifacts: "./hardhat-files/artifacts",
  },
  typechain: {
    outDir: "./hardhat-files/typechain-types",
  },
};

export default config;
