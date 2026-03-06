/**
 * PricePrediction direct write commands (no AgentRouter).
 * User calls these directly as an individual, not through an agent.
 */

import { Cli, z } from 'incur'
import { parseUnits } from 'viem'
import { getWalletClient } from '../../lib/chain.js'
import { getContracts, waitForTx } from '../../lib/contracts.js'
import { PricePredictionABI } from '../../lib/abis.js'

export const prediction = Cli.create('prediction', { description: 'PricePrediction — predict, claim, and batch claim directly (no agent)' })
  .command('predict', {
    description: 'Stake on a prediction market outcome (direct, no agent required)',
    options: z.object({
      marketId:  z.number().describe('Prediction market ID'),
      predictUp: z.boolean().describe('Predict price goes UP (true) or DOWN (false)'),
      amount:    z.string().describe('Stake amount in human-readable units (ETH decimals)'),
    }),
    async run(c) {
      const wallet = getWalletClient()
      const contracts = getContracts()
      const amountRaw = parseUnits(c.options.amount, 18)

      const hash = await wallet.writeContract({
        address: contracts.pricePrediction,
        abi: PricePredictionABI,
        functionName: 'predict',
        args: [BigInt(c.options.marketId), c.options.predictUp, amountRaw],
      })
      return {
        ...(await waitForTx(hash)),
        marketId:  c.options.marketId,
        predictUp: c.options.predictUp,
        amount:    c.options.amount,
      }
    },
  })
  .command('claim', {
    description: 'Claim prediction market winnings (direct, no agent required)',
    options: z.object({
      marketId: z.number().describe('Prediction market ID to claim from'),
    }),
    async run(c) {
      const wallet = getWalletClient()
      const contracts = getContracts()

      const hash = await wallet.writeContract({
        address: contracts.pricePrediction,
        abi: PricePredictionABI,
        functionName: 'claim',
        args: [BigInt(c.options.marketId)],
      })
      return { ...(await waitForTx(hash)), marketId: c.options.marketId }
    },
  })
  .command('claim-batch', {
    description: 'Claim winnings from multiple prediction markets at once',
    options: z.object({
      marketIds: z.string().describe('Comma-separated market IDs, e.g. 1,2,3'),
    }),
    async run(c) {
      const wallet = getWalletClient()
      const contracts = getContracts()
      const ids = c.options.marketIds.split(',').map((id) => BigInt(id.trim()))

      const hash = await wallet.writeContract({
        address: contracts.pricePrediction,
        abi: PricePredictionABI,
        functionName: 'claimBatch',
        args: [ids],
      })
      return { ...(await waitForTx(hash)), marketIds: c.options.marketIds, count: ids.length }
    },
  })
