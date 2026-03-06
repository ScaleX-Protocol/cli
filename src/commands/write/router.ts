/**
 * ScaleXRouter write commands.
 * Direct DEX router: cancel orders, borrow, repay, deposit.
 */

import { Cli, z } from 'incur'
import { parseUnits, type Address } from 'viem'
import { getWalletClient, publicClient } from '../../lib/chain.js'
import { getContracts, waitForTx } from '../../lib/contracts.js'
import { resolvePool } from '../../lib/pools.js'
import { RouterABI, ERC20ABI } from '../../lib/abis.js'

async function getDecimals(token: Address): Promise<number> {
  return publicClient().readContract({ address: token, abi: ERC20ABI, functionName: 'decimals' }) as Promise<number>
}

const poolOpts = z.object({
  symbol:       z.string().optional().describe('Trading pair, e.g. ETH-USDC'),
  baseCurrency: z.string().optional().describe('Base token address (alternative to --symbol)'),
  quoteCurrency:z.string().optional().describe('Quote token address (alternative to --symbol)'),
  orderBook:    z.string().optional().describe('OrderBook address (alternative to --symbol)'),
})

export const router = Cli.create('router', { description: 'ScaleXRouter — cancel orders, borrow, repay, deposit' })
  .command('cancel-order', {
    description: 'Cancel an order via the ScaleXRouter (caller must be order owner)',
    options: poolOpts.extend({
      orderId: z.number().describe('Order ID to cancel'),
    }),
    async run(c) {
      const wallet = getWalletClient()
      const contracts = getContracts()
      const pool = await resolvePool(c.options.symbol, c.options)

      const hash = await wallet.writeContract({
        address: contracts.router,
        abi: RouterABI,
        functionName: 'cancelOrder',
        args: [pool, c.options.orderId],
      })
      return { ...(await waitForTx(hash)), orderId: c.options.orderId }
    },
  })
  .command('borrow', {
    description: 'Borrow tokens from the lending pool via ScaleXRouter',
    options: z.object({
      token:  z.string().describe('Token address to borrow'),
      amount: z.string().describe('Amount in human-readable units'),
    }),
    async run(c) {
      const wallet = getWalletClient()
      const contracts = getContracts()
      const decimals = await getDecimals(c.options.token as Address)

      const hash = await wallet.writeContract({
        address: contracts.router,
        abi: RouterABI,
        functionName: 'borrow',
        args: [c.options.token as Address, parseUnits(c.options.amount, decimals)],
      })
      return { ...(await waitForTx(hash)), token: c.options.token, amount: c.options.amount }
    },
  })
  .command('repay', {
    description: 'Repay a borrow via ScaleXRouter',
    options: z.object({
      token:  z.string().describe('Token address to repay'),
      amount: z.string().describe('Amount in human-readable units'),
    }),
    async run(c) {
      const wallet = getWalletClient()
      const contracts = getContracts()
      const decimals = await getDecimals(c.options.token as Address)

      const hash = await wallet.writeContract({
        address: contracts.router,
        abi: RouterABI,
        functionName: 'repay',
        args: [c.options.token as Address, parseUnits(c.options.amount, decimals)],
      })
      return { ...(await waitForTx(hash)), token: c.options.token, amount: c.options.amount }
    },
  })
  .command('deposit', {
    description: 'Deposit tokens into the DEX via ScaleXRouter',
    options: z.object({
      token:  z.string().describe('Token address to deposit'),
      amount: z.string().describe('Amount in human-readable units'),
    }),
    async run(c) {
      const wallet = getWalletClient()
      const contracts = getContracts()
      const decimals = await getDecimals(c.options.token as Address)

      const hash = await wallet.writeContract({
        address: contracts.router,
        abi: RouterABI,
        functionName: 'deposit',
        args: [c.options.token as Address, parseUnits(c.options.amount, decimals)],
      })
      return { ...(await waitForTx(hash)), token: c.options.token, amount: c.options.amount }
    },
  })
