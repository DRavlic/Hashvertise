import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import {
  TESTNET_JSON_RPC_RELAY_URL,
  MAINNET_JSON_RPC_RELAY_URL,
  TESTNET_PRIVATE_KEY,
  MAINNET_PRIVATE_KEY,
} from "./src/environment";

import "./src/tasks/deposit";
import "./src/tasks/check-deposit";
import "./src/tasks/distribute-prize";

const config: HardhatUserConfig = {
  solidity: "0.8.28",
  defaultNetwork: "hederaTestnet",
  networks: {
    hederaTestnet: {
      url: TESTNET_JSON_RPC_RELAY_URL,
      accounts: [TESTNET_PRIVATE_KEY],
      chainId: 296,
    },
    hederaMainnet: {
      url: MAINNET_JSON_RPC_RELAY_URL,
      accounts: [MAINNET_PRIVATE_KEY],
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
