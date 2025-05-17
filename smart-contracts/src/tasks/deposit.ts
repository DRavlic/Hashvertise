import { task } from "hardhat/config";
import {
  Client,
  ContractExecuteTransaction,
  ContractFunctionParameters,
  Hbar,
  PrivateKey,
  AccountId,
  ContractId,
  HbarUnit,
  AccountInfoQuery,
} from "@hashgraph/sdk";
import {
  MAX_GAS,
  TESTNET_ACCOUNT_ID,
  TESTNET_PRIVATE_KEY,
} from "../environment";

// Register the deposit task
task("deposit", "Deposit HBAR to a contract for a specific topic")
  .addParam("contract", "The contract address")
  .addParam("topicId", "The topic ID")
  .addParam("amount", "The amount of HBAR to deposit")
  .addOptionalParam(
    "chain",
    "The network to use (testnet or mainnet)",
    "testnet"
  )
  .setAction(async (taskArgs) => {
    const { contract, topicId, amount: amountInHbar, chain } = taskArgs;

    console.log(
      `Depositing ${amountInHbar} HBAR to contract ${contract} for topic ${topicId} on ${chain} network...`
    );

    await depositHBAR(contract, topicId, amountInHbar, chain);
  });

async function depositHBAR(
  contract: string,
  topicId: string,
  amountInHbar: string,
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
      contractId = ContractId.fromEvmAddress(0, 0, contract);
    } else {
      // Assume it's already in Hedera format
      contractId = ContractId.fromString(contract);
    }

    // Get proper Solidity address via AccountInfoQuery
    // since toSolidityAddress() doesn't work correctly with ECDSA accounts
    const accountInfo = await new AccountInfoQuery()
      .setAccountId(accountId)
      .execute(client);

    const solPayerAddress = accountInfo.contractAccountId || "";
    if (!accountInfo.contractAccountId) {
      throw new Error(
        `Failed to get Solidity address for account ${accountId.toString()}`
      );
    }

    const functionParams = new ContractFunctionParameters()
      .addAddress(solPayerAddress)
      .addString(topicId);

    // Execute the contract call
    const contractExecTx = new ContractExecuteTransaction()
      .setContractId(contractId)
      .setFunction("deposit", functionParams)
      .setGas(MAX_GAS)
      .setPayableAmount(Hbar.from(parseFloat(amountInHbar), HbarUnit.Hbar))
      .freezeWith(client);

    const contractSignedTx = await contractExecTx.sign(privateKey);
    const contractResponse = await contractSignedTx.execute(client);
    const contractReceipt = await contractResponse.getReceipt(client);

    console.log(
      `[${contractReceipt.status.toString()}] Contract transaction ID: ${contractResponse.transactionId.toString()}`
    );
  } catch (error) {
    console.error("Error:", error);
    process.exitCode = 1;
  }
}
