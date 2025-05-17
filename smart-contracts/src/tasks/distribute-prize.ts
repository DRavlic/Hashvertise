import { task } from "hardhat/config";
import {
  Client,
  ContractExecuteTransaction,
  ContractFunctionParameters,
  PrivateKey,
  AccountId,
  ContractId,
  AccountInfoQuery,
  Hbar,
  HbarUnit,
} from "@hashgraph/sdk";
import {
  MAX_GAS,
  TESTNET_ACCOUNT_ID,
  TESTNET_PRIVATE_KEY,
} from "../environment";

// Register the distribute-prize task
task("distribute-prize", "Distribute prizes to participants from a campaign")
  .addParam("contract", "The contract address")
  .addParam("advertiser", "The advertiser address funding the prizes")
  .addParam("topicId", "The topic ID (campaign identifier)")
  .addParam("participants", "Comma-separated list of participant addresses")
  .addParam(
    "amounts",
    "Comma-separated list of amounts to distribute (in tinybars)"
  )
  .addOptionalParam(
    "chain",
    "The network to use (testnet or mainnet)",
    "testnet"
  )
  .setAction(async (taskArgs) => {
    const {
      contract,
      advertiser,
      topicId,
      participants: participantsStr,
      amounts: amountsStr,
      chain,
    } = taskArgs;

    const participants = participantsStr
      .split(",")
      .map((p: string) => p.trim());
    const amounts = amountsStr.split(",").map((a: string) => a.trim());

    console.log(
      `Distributing prizes for campaign ${topicId} from advertiser ${advertiser} to ${participants.length} participants on ${chain} network...`
    );

    await distributePrize(
      contract,
      advertiser,
      topicId,
      participants,
      amounts,
      chain
    );
  });

async function distributePrize(
  contract: string,
  advertiser: string,
  topicId: string,
  participants: string[],
  amounts: string[],
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

    client.setOperator(accountId, privateKey);

    let contractId: ContractId;
    if (contract.startsWith("0x")) {
      // Convert Ethereum address to Hedera Contract ID format
      contractId = ContractId.fromEvmAddress(0, 0, contract);
    } else {
      // Assume it's already in Hedera format
      contractId = ContractId.fromString(contract);
    }

    let solAdvertiserAddress: string;
    if (!advertiser.startsWith("0x")) {
      // Get proper Solidity address via AccountInfoQuery
      // since toSolidityAddress() doesn't work correctly with ECDSA accounts
      const advertiserAccountId = AccountId.fromString(advertiser);
      const advertiserInfo = await new AccountInfoQuery()
        .setAccountId(advertiserAccountId)
        .execute(client);

      solAdvertiserAddress = advertiserInfo.contractAccountId || "";
      if (!advertiserInfo.contractAccountId) {
        throw new Error(
          `Failed to get Solidity address for advertiser ${advertiser}`
        );
      }
    } else {
      solAdvertiserAddress = advertiser;
    }

    // Get proper Solidity addresses for participants via AccountInfoQuery
    const solParticipants: string[] = [];

    for (const participant of participants) {
      if (!participant.startsWith("0x")) {
        // Get proper Solidity address via AccountInfoQuery
        // since toSolidityAddress() doesn't work correctly with ECDSA accounts
        const participantId = AccountId.fromString(participant);
        const participantInfo = await new AccountInfoQuery()
          .setAccountId(participantId)
          .execute(client);

        if (!participantInfo.contractAccountId) {
          throw new Error(
            `Failed to get Solidity address for participant ${participant}`
          );
        }

        solParticipants.push(participantInfo.contractAccountId);
      } else {
        solParticipants.push(participant);
      }
    }

    // Prepare function parameters
    const functionParams = new ContractFunctionParameters()
      .addAddress(solAdvertiserAddress)
      .addString(topicId)
      .addAddressArray(solParticipants)
      .addUint256Array(
        amounts.map((amount) =>
          Hbar.from(parseFloat(amount), HbarUnit.Hbar).toTinybars()
        )
      );

    // Execute the contract call
    const contractExecTx = new ContractExecuteTransaction()
      .setContractId(contractId)
      .setFunction("distributePrize", functionParams)
      .setGas(MAX_GAS)
      .freezeWith(client);

    const contractSignedTx = await contractExecTx.sign(privateKey);
    const contractResponse = await contractSignedTx.execute(client);
    const contractReceipt = await contractResponse.getReceipt(client);

    console.log(
      `[${contractReceipt.status.toString()}] Prize distribution completed. Transaction ID: ${contractResponse.transactionId.toString()}`
    );
  } catch (error) {
    console.error("Error:", error);
    process.exitCode = 1;
  }
}
