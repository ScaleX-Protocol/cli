/**
 * AgentRouter write commands.
 * Requires PRIVATE_KEY + SCALEX_AGENT_TOKEN_ID env vars.
 */

import { Cli, z } from 'incur'
import { parseUnits } from 'viem'
import { getWalletClient, publicClient } from '../../lib/chain.js'
import { getContracts, getAgentTokenId, waitForTx } from '../../lib/contracts.js'
import { resolvePool } from '../../lib/pools.js'
import {
  AgentRouterTradingABI,
  AgentRouterPredictionABI,
  AgentRouterLendingABI,
  AgentRouterMarketplaceABI,
  AgentRouterCREABI,
  ERC20ABI,
} from '../../lib/abis.js'
import type { Address } from 'viem'

const SIDE = { BUY: 0, SELL: 1 } as const
const TIF  = { GTC: 0, IOC: 1, FOK: 2, POST_ONLY: 3 } as const

// Common pool options for commands that need a symbol
const poolOpts = z.object({
  symbol:       z.string().optional().describe('Trading pair, e.g. ETH-USDC'),
  baseCurrency: z.string().optional().describe('Base token address (alternative to --symbol)'),
  quoteCurrency:z.string().optional().describe('Quote token address (alternative to --symbol)'),
  orderBook:    z.string().optional().describe('OrderBook address (alternative to --symbol)'),
})

async function getDecimals(token: Address): Promise<number> {
  return publicClient().readContract({ address: token, abi: ERC20ABI, functionName: 'decimals' }) as Promise<number>
}

export const agent = Cli.create('agent', { description: 'AgentRouter — delegated and self-funded trading, predictions, lending' })

  // ─── Self-funded orders ────────────────────────────────────────────────────

  .command('self-limit-order', {
    description: 'Place a limit order as an agent trading its own funds',
    options: poolOpts.extend({
      agentTokenId: z.string().optional().describe('Agent NFT token ID (default: $SCALEX_AGENT_TOKEN_ID)'),
      price:        z.string().describe('Limit price in human-readable units'),
      quantity:     z.string().describe('Quantity in human-readable units'),
      side:         z.enum(['BUY', 'SELL']).describe('Order side'),
      tif:          z.enum(['GTC', 'IOC', 'FOK', 'POST_ONLY']).optional().default('GTC').describe('Time in force'),
    }),
    async run(c) {
      const wallet = getWalletClient()
      const contracts = getContracts()
      const agentId = c.options.agentTokenId ? BigInt(c.options.agentTokenId) : getAgentTokenId()
      const pool = await resolvePool(c.options.symbol, c.options)

      const [baseDecimals, quoteDecimals] = await Promise.all([
        getDecimals(pool.baseCurrency),
        getDecimals(pool.quoteCurrency),
      ])
      const priceRaw = parseUnits(c.options.price, quoteDecimals)
      const qtyRaw   = parseUnits(c.options.quantity, baseDecimals)

      const hash = await wallet.writeContract({
        address: contracts.agentRouter,
        abi: AgentRouterTradingABI,
        functionName: 'executeSelfLimitOrder',
        args: [agentId, pool, priceRaw, qtyRaw, SIDE[c.options.side], TIF[c.options.tif ?? 'GTC']],
      })
      return { ...(await waitForTx(hash)), price: c.options.price, quantity: c.options.quantity, side: c.options.side }
    },
  })

  .command('self-market-order', {
    description: 'Place a market order as an agent trading its own funds',
    options: poolOpts.extend({
      agentTokenId: z.string().optional().describe('Agent NFT token ID (default: $SCALEX_AGENT_TOKEN_ID)'),
      quantity:     z.string().describe('Quantity in human-readable units'),
      side:         z.enum(['BUY', 'SELL']).describe('Order side'),
      minOut:       z.string().optional().default('0').describe('Minimum output amount (slippage protection)'),
    }),
    async run(c) {
      const wallet = getWalletClient()
      const contracts = getContracts()
      const agentId = c.options.agentTokenId ? BigInt(c.options.agentTokenId) : getAgentTokenId()
      const pool = await resolvePool(c.options.symbol, c.options)

      const [baseDecimals, quoteDecimals] = await Promise.all([
        getDecimals(pool.baseCurrency),
        getDecimals(pool.quoteCurrency),
      ])
      const qtyDecimals = c.options.side === 'BUY' ? quoteDecimals : baseDecimals
      const outDecimals = c.options.side === 'BUY' ? baseDecimals : quoteDecimals
      const qtyRaw    = parseUnits(c.options.quantity, qtyDecimals)
      const minOutRaw = parseUnits(c.options.minOut ?? '0', outDecimals)

      const hash = await wallet.writeContract({
        address: contracts.agentRouter,
        abi: AgentRouterTradingABI,
        functionName: 'executeSelfMarketOrder',
        args: [agentId, pool, SIDE[c.options.side], qtyRaw, minOutRaw],
      })
      return { ...(await waitForTx(hash)), quantity: c.options.quantity, side: c.options.side }
    },
  })

  .command('cancel-self-order', {
    description: 'Cancel an order placed by the agent itself',
    options: poolOpts.extend({
      agentTokenId: z.string().optional().describe('Agent NFT token ID (default: $SCALEX_AGENT_TOKEN_ID)'),
      orderId:      z.number().describe('Order ID to cancel'),
    }),
    async run(c) {
      const wallet = getWalletClient()
      const contracts = getContracts()
      const agentId = c.options.agentTokenId ? BigInt(c.options.agentTokenId) : getAgentTokenId()
      const pool = await resolvePool(c.options.symbol, c.options)

      const hash = await wallet.writeContract({
        address: contracts.agentRouter,
        abi: AgentRouterTradingABI,
        functionName: 'cancelSelfOrder',
        args: [agentId, pool, c.options.orderId],
      })
      return { ...(await waitForTx(hash)), orderId: c.options.orderId }
    },
  })

  // ─── Delegated orders (acting on behalf of authorized user) ───────────────

  .command('execute-limit-order', {
    description: 'Place a limit order on behalf of an authorized user',
    options: poolOpts.extend({
      user:         z.string().describe('User wallet address'),
      agentTokenId: z.string().optional().describe('Agent NFT token ID (default: $SCALEX_AGENT_TOKEN_ID)'),
      price:        z.string().describe('Limit price in human-readable units'),
      quantity:     z.string().describe('Quantity in human-readable units'),
      side:         z.enum(['BUY', 'SELL']).describe('Order side'),
      tif:          z.enum(['GTC', 'IOC', 'FOK', 'POST_ONLY']).optional().default('GTC').describe('Time in force'),
      autoRepay:    z.boolean().optional().default(false).describe('Auto repay borrows'),
      autoBorrow:   z.boolean().optional().default(false).describe('Auto borrow if insufficient balance'),
    }),
    async run(c) {
      const wallet = getWalletClient()
      const contracts = getContracts()
      const agentId = c.options.agentTokenId ? BigInt(c.options.agentTokenId) : getAgentTokenId()
      const pool = await resolvePool(c.options.symbol, c.options)

      const [baseDecimals, quoteDecimals] = await Promise.all([
        getDecimals(pool.baseCurrency),
        getDecimals(pool.quoteCurrency),
      ])
      const priceRaw = parseUnits(c.options.price, quoteDecimals)
      const qtyRaw   = parseUnits(c.options.quantity, baseDecimals)

      const hash = await wallet.writeContract({
        address: contracts.agentRouter,
        abi: AgentRouterTradingABI,
        functionName: 'executeLimitOrder',
        args: [c.options.user as Address, agentId, pool, priceRaw, qtyRaw, SIDE[c.options.side], TIF[c.options.tif ?? 'GTC'], c.options.autoRepay ?? false, c.options.autoBorrow ?? false],
      })
      return { ...(await waitForTx(hash)), user: c.options.user, price: c.options.price, quantity: c.options.quantity, side: c.options.side }
    },
  })

  .command('execute-market-order', {
    description: 'Place a market order on behalf of an authorized user',
    options: poolOpts.extend({
      user:         z.string().describe('User wallet address'),
      agentTokenId: z.string().optional().describe('Agent NFT token ID (default: $SCALEX_AGENT_TOKEN_ID)'),
      quantity:     z.string().describe('Quantity in human-readable units'),
      side:         z.enum(['BUY', 'SELL']).describe('Order side'),
      minOut:       z.string().optional().default('0').describe('Minimum output amount'),
      autoRepay:    z.boolean().optional().default(false).describe('Auto repay borrows'),
      autoBorrow:   z.boolean().optional().default(false).describe('Auto borrow if insufficient balance'),
    }),
    async run(c) {
      const wallet = getWalletClient()
      const contracts = getContracts()
      const agentId = c.options.agentTokenId ? BigInt(c.options.agentTokenId) : getAgentTokenId()
      const pool = await resolvePool(c.options.symbol, c.options)

      const [baseDecimals, quoteDecimals] = await Promise.all([
        getDecimals(pool.baseCurrency),
        getDecimals(pool.quoteCurrency),
      ])
      const qtyDecimals = c.options.side === 'BUY' ? quoteDecimals : baseDecimals
      const outDecimals = c.options.side === 'BUY' ? baseDecimals : quoteDecimals
      const qtyRaw    = parseUnits(c.options.quantity, qtyDecimals)
      const minOutRaw = parseUnits(c.options.minOut ?? '0', outDecimals)

      const hash = await wallet.writeContract({
        address: contracts.agentRouter,
        abi: AgentRouterTradingABI,
        functionName: 'executeMarketOrder',
        args: [c.options.user as Address, agentId, pool, SIDE[c.options.side], qtyRaw, minOutRaw, c.options.autoRepay ?? false, c.options.autoBorrow ?? false],
      })
      return { ...(await waitForTx(hash)), user: c.options.user, quantity: c.options.quantity, side: c.options.side }
    },
  })

  .command('cancel-order', {
    description: 'Cancel an order on behalf of an authorized user',
    options: poolOpts.extend({
      user:         z.string().describe('User wallet address'),
      agentTokenId: z.string().optional().describe('Agent NFT token ID (default: $SCALEX_AGENT_TOKEN_ID)'),
      orderId:      z.number().describe('Order ID to cancel'),
    }),
    async run(c) {
      const wallet = getWalletClient()
      const contracts = getContracts()
      const agentId = c.options.agentTokenId ? BigInt(c.options.agentTokenId) : getAgentTokenId()
      const pool = await resolvePool(c.options.symbol, c.options)

      const hash = await wallet.writeContract({
        address: contracts.agentRouter,
        abi: AgentRouterTradingABI,
        functionName: 'cancelOrder',
        args: [c.options.user as Address, agentId, pool, c.options.orderId],
      })
      return { ...(await waitForTx(hash)), user: c.options.user, orderId: c.options.orderId }
    },
  })

  // ─── Marketplace & Policy ─────────────────────────────────────────────────

  .command('authorize', {
    description: 'Authorize an agent with a policy (called by user to grant agent access)',
    options: z.object({
      agentTokenId: z.string().optional().describe('Agent NFT token ID (default: $SCALEX_AGENT_TOKEN_ID)'),
      policy:       z.string().describe(
        'Policy JSON matching PolicyFactoryStorage.Policy fields. ' +
        'Required fields: enabled (bool). ' +
        'All other fields default to 0/false if omitted. ' +
        'Example: {"enabled":true,"allowMarketOrders":true,"allowLimitOrders":true,"maxOrderSize":"1000000000000000000","whitelistedTokens":[],"blacklistedTokens":[]}'
      ),
    }),
    async run(c) {
      const wallet = getWalletClient()
      const contracts = getContracts()
      const agentId = c.options.agentTokenId ? BigInt(c.options.agentTokenId) : getAgentTokenId()
      const policy = JSON.parse(c.options.policy)

      const hash = await wallet.writeContract({
        address: contracts.agentRouter,
        abi: AgentRouterMarketplaceABI,
        functionName: 'authorize',
        args: [agentId, policy],
      })
      return waitForTx(hash)
    },
  })

  .command('revoke', {
    description: 'Revoke agent authorization',
    options: z.object({
      agentTokenId: z.string().optional().describe('Agent NFT token ID (default: $SCALEX_AGENT_TOKEN_ID)'),
    }),
    async run(c) {
      const wallet = getWalletClient()
      const contracts = getContracts()
      const agentId = c.options.agentTokenId ? BigInt(c.options.agentTokenId) : getAgentTokenId()

      const hash = await wallet.writeContract({
        address: contracts.agentRouter,
        abi: AgentRouterMarketplaceABI,
        functionName: 'revoke',
        args: [agentId],
      })
      return waitForTx(hash)
    },
  })

  .command('list-marketplace', {
    description: 'List agent on the marketplace',
    options: z.object({
      agentTokenId: z.string().optional().describe('Agent NFT token ID (default: $SCALEX_AGENT_TOKEN_ID)'),
    }),
    async run(c) {
      const wallet = getWalletClient()
      const contracts = getContracts()
      const agentId = c.options.agentTokenId ? BigInt(c.options.agentTokenId) : getAgentTokenId()

      const hash = await wallet.writeContract({
        address: contracts.agentRouter,
        abi: AgentRouterMarketplaceABI,
        functionName: 'listOnMarketplace',
        args: [agentId],
      })
      return waitForTx(hash)
    },
  })

  .command('delist-marketplace', {
    description: 'Remove agent from the marketplace',
    options: z.object({
      agentTokenId: z.string().optional().describe('Agent NFT token ID (default: $SCALEX_AGENT_TOKEN_ID)'),
    }),
    async run(c) {
      const wallet = getWalletClient()
      const contracts = getContracts()
      const agentId = c.options.agentTokenId ? BigInt(c.options.agentTokenId) : getAgentTokenId()

      const hash = await wallet.writeContract({
        address: contracts.agentRouter,
        abi: AgentRouterMarketplaceABI,
        functionName: 'delistFromMarketplace',
        args: [agentId],
      })
      return waitForTx(hash)
    },
  })

  // ─── Predictions ──────────────────────────────────────────────────────────

  .command('self-predict', {
    description: 'Place a prediction using agent own funds',
    options: z.object({
      agentTokenId: z.string().optional().describe('Agent NFT token ID (default: $SCALEX_AGENT_TOKEN_ID)'),
      marketId:     z.number().describe('Prediction market ID'),
      predictUp:    z.boolean().describe('Predict price goes UP (true) or DOWN (false)'),
      amount:       z.string().describe('Stake amount in human-readable units'),
    }),
    async run(c) {
      const wallet = getWalletClient()
      const contracts = getContracts()
      const agentId = c.options.agentTokenId ? BigInt(c.options.agentTokenId) : getAgentTokenId()
      const amountRaw = parseUnits(c.options.amount, 18)

      const hash = await wallet.writeContract({
        address: contracts.agentRouter,
        abi: AgentRouterPredictionABI,
        functionName: 'selfPredict',
        args: [agentId, BigInt(c.options.marketId), c.options.predictUp, amountRaw],
      })
      return { ...(await waitForTx(hash)), marketId: c.options.marketId, predictUp: c.options.predictUp, amount: c.options.amount }
    },
  })

  .command('self-claim', {
    description: 'Claim prediction winnings using agent own funds',
    options: z.object({
      agentTokenId: z.string().optional().describe('Agent NFT token ID (default: $SCALEX_AGENT_TOKEN_ID)'),
      marketId:     z.number().describe('Prediction market ID'),
    }),
    async run(c) {
      const wallet = getWalletClient()
      const contracts = getContracts()
      const agentId = c.options.agentTokenId ? BigInt(c.options.agentTokenId) : getAgentTokenId()

      const hash = await wallet.writeContract({
        address: contracts.agentRouter,
        abi: AgentRouterPredictionABI,
        functionName: 'selfClaimPrediction',
        args: [agentId, BigInt(c.options.marketId)],
      })
      return { ...(await waitForTx(hash)), marketId: c.options.marketId }
    },
  })

  .command('execute-predict', {
    description: 'Place a prediction on behalf of an authorized user',
    options: z.object({
      user:         z.string().describe('User wallet address'),
      agentTokenId: z.string().optional().describe('Agent NFT token ID (default: $SCALEX_AGENT_TOKEN_ID)'),
      marketId:     z.number().describe('Prediction market ID'),
      predictUp:    z.boolean().describe('Predict price goes UP (true) or DOWN (false)'),
      amount:       z.string().describe('Stake amount in human-readable units'),
    }),
    async run(c) {
      const wallet = getWalletClient()
      const contracts = getContracts()
      const agentId = c.options.agentTokenId ? BigInt(c.options.agentTokenId) : getAgentTokenId()
      const amountRaw = parseUnits(c.options.amount, 18)

      const hash = await wallet.writeContract({
        address: contracts.agentRouter,
        abi: AgentRouterPredictionABI,
        functionName: 'executePredict',
        args: [c.options.user as Address, agentId, BigInt(c.options.marketId), c.options.predictUp, amountRaw],
      })
      return { ...(await waitForTx(hash)), user: c.options.user, marketId: c.options.marketId, predictUp: c.options.predictUp }
    },
  })

  .command('execute-claim', {
    description: 'Claim prediction winnings on behalf of an authorized user',
    options: z.object({
      user:         z.string().describe('User wallet address'),
      agentTokenId: z.string().optional().describe('Agent NFT token ID (default: $SCALEX_AGENT_TOKEN_ID)'),
      marketId:     z.number().describe('Prediction market ID'),
    }),
    async run(c) {
      const wallet = getWalletClient()
      const contracts = getContracts()
      const agentId = c.options.agentTokenId ? BigInt(c.options.agentTokenId) : getAgentTokenId()

      const hash = await wallet.writeContract({
        address: contracts.agentRouter,
        abi: AgentRouterPredictionABI,
        functionName: 'executeClaimPrediction',
        args: [c.options.user as Address, agentId, BigInt(c.options.marketId)],
      })
      return { ...(await waitForTx(hash)), user: c.options.user, marketId: c.options.marketId }
    },
  })

  // ─── Lending ──────────────────────────────────────────────────────────────

  .command('self-borrow', {
    description: 'Borrow tokens using agent own collateral',
    options: z.object({
      agentTokenId: z.string().optional().describe('Agent NFT token ID (default: $SCALEX_AGENT_TOKEN_ID)'),
      token:        z.string().describe('Token address to borrow'),
      amount:       z.string().describe('Amount in human-readable units'),
    }),
    async run(c) {
      const wallet = getWalletClient()
      const contracts = getContracts()
      const agentId = c.options.agentTokenId ? BigInt(c.options.agentTokenId) : getAgentTokenId()
      const decimals = await getDecimals(c.options.token as Address)

      const hash = await wallet.writeContract({
        address: contracts.agentRouter,
        abi: AgentRouterLendingABI,
        functionName: 'selfBorrow',
        args: [agentId, c.options.token as Address, parseUnits(c.options.amount, decimals)],
      })
      return { ...(await waitForTx(hash)), token: c.options.token, amount: c.options.amount }
    },
  })

  .command('self-repay', {
    description: 'Repay borrowed tokens using agent own funds',
    options: z.object({
      agentTokenId: z.string().optional().describe('Agent NFT token ID (default: $SCALEX_AGENT_TOKEN_ID)'),
      token:        z.string().describe('Token address to repay'),
      amount:       z.string().describe('Amount in human-readable units'),
    }),
    async run(c) {
      const wallet = getWalletClient()
      const contracts = getContracts()
      const agentId = c.options.agentTokenId ? BigInt(c.options.agentTokenId) : getAgentTokenId()
      const decimals = await getDecimals(c.options.token as Address)

      const hash = await wallet.writeContract({
        address: contracts.agentRouter,
        abi: AgentRouterLendingABI,
        functionName: 'selfRepay',
        args: [agentId, c.options.token as Address, parseUnits(c.options.amount, decimals)],
      })
      return { ...(await waitForTx(hash)), token: c.options.token, amount: c.options.amount }
    },
  })

  .command('execute-borrow', {
    description: 'Borrow tokens on behalf of an authorized user',
    options: z.object({
      user:         z.string().describe('User wallet address'),
      agentTokenId: z.string().optional().describe('Agent NFT token ID (default: $SCALEX_AGENT_TOKEN_ID)'),
      token:        z.string().describe('Token address to borrow'),
      amount:       z.string().describe('Amount in human-readable units'),
    }),
    async run(c) {
      const wallet = getWalletClient()
      const contracts = getContracts()
      const agentId = c.options.agentTokenId ? BigInt(c.options.agentTokenId) : getAgentTokenId()
      const decimals = await getDecimals(c.options.token as Address)

      const hash = await wallet.writeContract({
        address: contracts.agentRouter,
        abi: AgentRouterLendingABI,
        functionName: 'executeBorrow',
        args: [c.options.user as Address, agentId, c.options.token as Address, parseUnits(c.options.amount, decimals)],
      })
      return { ...(await waitForTx(hash)), user: c.options.user, token: c.options.token, amount: c.options.amount }
    },
  })

  .command('execute-repay', {
    description: 'Repay tokens on behalf of an authorized user',
    options: z.object({
      user:         z.string().describe('User wallet address'),
      agentTokenId: z.string().optional().describe('Agent NFT token ID (default: $SCALEX_AGENT_TOKEN_ID)'),
      token:        z.string().describe('Token address to repay'),
      amount:       z.string().describe('Amount in human-readable units'),
    }),
    async run(c) {
      const wallet = getWalletClient()
      const contracts = getContracts()
      const agentId = c.options.agentTokenId ? BigInt(c.options.agentTokenId) : getAgentTokenId()
      const decimals = await getDecimals(c.options.token as Address)

      const hash = await wallet.writeContract({
        address: contracts.agentRouter,
        abi: AgentRouterLendingABI,
        functionName: 'executeRepay',
        args: [c.options.user as Address, agentId, c.options.token as Address, parseUnits(c.options.amount, decimals)],
      })
      return { ...(await waitForTx(hash)), user: c.options.user, token: c.options.token, amount: c.options.amount }
    },
  })

  .command('execute-supply', {
    description: 'Supply collateral on behalf of an authorized user',
    options: z.object({
      user:         z.string().describe('User wallet address'),
      agentTokenId: z.string().optional().describe('Agent NFT token ID (default: $SCALEX_AGENT_TOKEN_ID)'),
      token:        z.string().describe('Token address to supply'),
      amount:       z.string().describe('Amount in human-readable units'),
    }),
    async run(c) {
      const wallet = getWalletClient()
      const contracts = getContracts()
      const agentId = c.options.agentTokenId ? BigInt(c.options.agentTokenId) : getAgentTokenId()
      const decimals = await getDecimals(c.options.token as Address)

      const hash = await wallet.writeContract({
        address: contracts.agentRouter,
        abi: AgentRouterLendingABI,
        functionName: 'executeSupplyCollateral',
        args: [c.options.user as Address, agentId, c.options.token as Address, parseUnits(c.options.amount, decimals)],
      })
      return { ...(await waitForTx(hash)), user: c.options.user, token: c.options.token, amount: c.options.amount }
    },
  })

  .command('execute-withdraw', {
    description: 'Withdraw collateral on behalf of an authorized user',
    options: z.object({
      user:         z.string().describe('User wallet address'),
      agentTokenId: z.string().optional().describe('Agent NFT token ID (default: $SCALEX_AGENT_TOKEN_ID)'),
      token:        z.string().describe('Token address to withdraw'),
      amount:       z.string().describe('Amount in human-readable units'),
    }),
    async run(c) {
      const wallet = getWalletClient()
      const contracts = getContracts()
      const agentId = c.options.agentTokenId ? BigInt(c.options.agentTokenId) : getAgentTokenId()
      const decimals = await getDecimals(c.options.token as Address)

      const hash = await wallet.writeContract({
        address: contracts.agentRouter,
        abi: AgentRouterLendingABI,
        functionName: 'executeWithdrawCollateral',
        args: [c.options.user as Address, agentId, c.options.token as Address, parseUnits(c.options.amount, decimals)],
      })
      return { ...(await waitForTx(hash)), user: c.options.user, token: c.options.token, amount: c.options.amount }
    },
  })

  // ─── CRE (Chainlink Functions) Queue ──────────────────────────────────────
  // Only usable when the agent's policy has requiresChainlinkFunctions = true.
  // Orders are queued for off-chain validation before execution.

  .command('queue-market-order', {
    description: 'Queue a market order for CRE off-chain validation (requires policy.requiresChainlinkFunctions = true)',
    options: poolOpts.extend({
      user:         z.string().describe('User wallet address'),
      agentTokenId: z.string().optional().describe('Agent NFT token ID (default: $SCALEX_AGENT_TOKEN_ID)'),
      quantity:     z.string().describe('Quantity in human-readable units'),
      side:         z.enum(['BUY', 'SELL']).describe('Order side'),
      minOut:       z.string().optional().default('0').describe('Minimum output amount (slippage protection)'),
      autoRepay:    z.boolean().optional().default(false).describe('Auto repay borrows after fill'),
      autoBorrow:   z.boolean().optional().default(false).describe('Auto borrow if insufficient balance'),
    }),
    async run(c) {
      const wallet = getWalletClient()
      const contracts = getContracts()
      const agentId = c.options.agentTokenId ? BigInt(c.options.agentTokenId) : getAgentTokenId()
      const pool = await resolvePool(c.options.symbol, c.options)

      const [baseDecimals, quoteDecimals] = await Promise.all([
        getDecimals(pool.baseCurrency),
        getDecimals(pool.quoteCurrency),
      ])
      const qtyDecimals = c.options.side === 'BUY' ? quoteDecimals : baseDecimals
      const outDecimals = c.options.side === 'BUY' ? baseDecimals : quoteDecimals
      const qtyRaw    = parseUnits(c.options.quantity, qtyDecimals)
      const minOutRaw = parseUnits(c.options.minOut ?? '0', outDecimals)

      const hash = await wallet.writeContract({
        address: contracts.agentRouter,
        abi: AgentRouterCREABI,
        functionName: 'queueMarketOrder',
        args: [c.options.user as Address, agentId, pool, SIDE[c.options.side], qtyRaw, minOutRaw, c.options.autoRepay ?? false, c.options.autoBorrow ?? false],
      })
      return { ...(await waitForTx(hash)), user: c.options.user, quantity: c.options.quantity, side: c.options.side }
    },
  })

  .command('queue-limit-order', {
    description: 'Queue a limit order for CRE off-chain validation (requires policy.requiresChainlinkFunctions = true)',
    options: poolOpts.extend({
      user:         z.string().describe('User wallet address'),
      agentTokenId: z.string().optional().describe('Agent NFT token ID (default: $SCALEX_AGENT_TOKEN_ID)'),
      price:        z.string().describe('Limit price in human-readable units'),
      quantity:     z.string().describe('Quantity in human-readable units'),
      side:         z.enum(['BUY', 'SELL']).describe('Order side'),
      tif:          z.enum(['GTC', 'IOC', 'FOK', 'POST_ONLY']).optional().default('GTC').describe('Time in force'),
      autoRepay:    z.boolean().optional().default(false).describe('Auto repay borrows after fill'),
      autoBorrow:   z.boolean().optional().default(false).describe('Auto borrow if insufficient balance'),
    }),
    async run(c) {
      const wallet = getWalletClient()
      const contracts = getContracts()
      const agentId = c.options.agentTokenId ? BigInt(c.options.agentTokenId) : getAgentTokenId()
      const pool = await resolvePool(c.options.symbol, c.options)

      const [baseDecimals, quoteDecimals] = await Promise.all([
        getDecimals(pool.baseCurrency),
        getDecimals(pool.quoteCurrency),
      ])
      const priceRaw = parseUnits(c.options.price, quoteDecimals)
      const qtyRaw   = parseUnits(c.options.quantity, baseDecimals)

      const hash = await wallet.writeContract({
        address: contracts.agentRouter,
        abi: AgentRouterCREABI,
        functionName: 'queueLimitOrder',
        args: [c.options.user as Address, agentId, pool, priceRaw, qtyRaw, SIDE[c.options.side], TIF[c.options.tif ?? 'GTC'], c.options.autoRepay ?? false, c.options.autoBorrow ?? false],
      })
      return { ...(await waitForTx(hash)), user: c.options.user, price: c.options.price, quantity: c.options.quantity, side: c.options.side }
    },
  })

  .command('cancel-pending-order', {
    description: 'Cancel a queued CRE pending order and unlock reserved funds (callable by user or agent owner)',
    options: z.object({
      pendingOrderId: z.number().describe('Pending order ID returned by queue-market-order or queue-limit-order'),
    }),
    async run(c) {
      const wallet = getWalletClient()
      const contracts = getContracts()

      const hash = await wallet.writeContract({
        address: contracts.agentRouter,
        abi: AgentRouterCREABI,
        functionName: 'cancelPendingOrder',
        args: [BigInt(c.options.pendingOrderId)],
      })
      return { ...(await waitForTx(hash)), pendingOrderId: c.options.pendingOrderId }
    },
  })

  .command('get-pending-order', {
    description: 'Read the state of a CRE pending order (view — no transaction)',
    options: z.object({
      pendingOrderId: z.number().describe('Pending order ID to look up'),
    }),
    async run(c) {
      return publicClient().readContract({
        address: getContracts().agentRouter,
        abi: AgentRouterCREABI,
        functionName: 'getPendingOrder',
        args: [BigInt(c.options.pendingOrderId)],
      })
    },
  })
