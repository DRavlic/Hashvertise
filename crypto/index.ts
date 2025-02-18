import { Client, AccountBalanceQuery } from '@hashgraph/sdk'
import { HEDERA_OPERATOR_ID, HEDERA_OPERATOR_KEY, HEDERA_NETWORK } from './env'

async function main() {
  if (!HEDERA_OPERATOR_ID || !HEDERA_OPERATOR_KEY) {
    console.error('Please set HEDERA_OPERATOR_ID and HEDERA_OPERATOR_KEY in environment variables')
    return
  }

  // Create a client for the testnet
  const client = Client.forTestnet()
  client.setOperator(HEDERA_OPERATOR_ID, HEDERA_OPERATOR_KEY)

  try {
    const accountBalance = await new AccountBalanceQuery()
      .setAccountId(HEDERA_OPERATOR_ID)
      .execute(client)
    console.log(`Account balance for ${HEDERA_OPERATOR_ID}: ${accountBalance.hbars.toString()}`)
  } catch (error) {
    console.error('Error fetching account balance:', error)
  }
}

main() 