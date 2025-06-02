import { task } from "hardhat/config";
import {
  Client,
  ContractCallQuery,
  ContractFunctionParameters,
  Hbar,
  PrivateKey,
  AccountId,
  ContractId,
  AccountInfoQuery,
} from "@hashgraph/sdk";
import {
  MAX_GAS,
  TESTNET_ACCOUNT_ID,
  TESTNET_PRIVATE_KEY,
} from "../environment";

// Register the check-deposit task
task("check-deposit", "Check deposit amount for an address and topic")
  .addParam("contract", "The contract address")
  .addParam("address", "The payer address")
  .addParam("topicId", "The topic ID")
  .addOptionalParam(
    "chain",
    "The network to use (testnet or mainnet)",
    "testnet"
  )
  .setAction(async (taskArgs) => {
    const { contract, address: payerAddress, topicId, chain } = taskArgs;

    await checkDeposit(contract, payerAddress, topicId, chain);
  });

async function checkDeposit(
  contract: string,
  payerAddress: string,
  topicId: string,
  chain: string = "testnet"
): Promise<void> {
  try {
    let client: Client;
    if (chain === "mainnet") {
      client = Client.forMainnet();
    } else {
      client = Client.forTestnet();
    }

    const accountId = AccountId.fromString(TESTNET_ACCOUNT_ID);
    const privateKey = PrivateKey.fromStringECDSA(TESTNET_PRIVATE_KEY);
    // const privateKey = PrivateKey.fromStringED25519(HEDERA_TESTNET_PRIVATE_KEY);

    client.setOperator(accountId, privateKey);

    let contractId: ContractId;
    if (contract.startsWith("0x")) {
      // Convert Ethereum address to Hedera Contract ID format
      contractId = ContractId.fromEvmAddress(0, 0, contract); // TO DO: handle shard and realm properly
    } else {
      // Assume it's already in Hedera format
      contractId = ContractId.fromString(contract);
    }

    let solPayerAddress: string;
    if (!payerAddress.startsWith("0x")) {
      // Get proper Solidity address via AccountInfoQuery
      // since toSolidityAddress() doesn't work correctly with ECDSA accounts
      const payerAccountId = AccountId.fromString(payerAddress);
      const payerInfo = await new AccountInfoQuery()
        .setAccountId(payerAccountId)
        .execute(client);

      solPayerAddress = payerInfo.contractAccountId || "";
      if (!payerInfo.contractAccountId) {
        throw new Error(
          `Failed to get Solidity address for account ${payerAddress}`
        );
      }
      console.log(`Payer Solidity address: ${solPayerAddress}`);
    } else {
      // Assume it's already in Ethereum format
      solPayerAddress = payerAddress;
    }

    const depositQuery = new ContractCallQuery()
      .setContractId(contractId)
      .setGas(MAX_GAS)
      .setFunction(
        "getDeposit",
        new ContractFunctionParameters()
          .addAddress(solPayerAddress)
          .addString(topicId)
      );

    const depositResult = await depositQuery.execute(client);

    // Convert the result to a readable format - assuming it returns a uint256
    const depositAmountTinybars = depositResult.getUint256(0).toString();
    const depositInHbar = Hbar.fromTinybars(depositAmountTinybars);

    console.log(
      `Verified deposit: ${depositInHbar.toString()} for topic ${topicId}`
    );
  } catch (error) {
    console.error("Error:", error);
    process.exitCode = 1;
  }
}
