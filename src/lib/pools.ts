/**
 * Pool symbol → Pool struct resolution.
 * Lazy cache from /api/markets. Falls back to raw address flags.
 */

import { fetchAPI } from './api.js'
import { publicClient } from './chain.js'
import { getContracts } from './contracts.js'
import { PoolManagerABI } from './abis.js'
import type { Address } from 'viem'

export interface PoolStruct {
  baseCurrency: Address
  quoteCurrency: Address
  orderBook: Address
}

interface Market {
  symbol: string
  baseCurrency: string
  quoteCurrency: string
  orderBook?: string
  pool?: PoolStruct
}

let poolCache: Map<string, PoolStruct> | null = null

async function buildPoolCache(): Promise<Map<string, PoolStruct>> {
  if (poolCache) return poolCache
  poolCache = new Map()
  try {
    const markets = await fetchAPI<Market[]>('/api/markets')
    for (const m of markets) {
      if (m.symbol && m.baseCurrency && m.quoteCurrency) {
        // Fetch the pool struct from chain to get orderBook address
        try {
          const contracts = getContracts()
          const pool = await publicClient().readContract({
            address: contracts.poolManager,
            abi: PoolManagerABI,
            functionName: 'getPool',
            args: [{ baseCurrency: m.baseCurrency as Address, quoteCurrency: m.quoteCurrency as Address }],
          }) as PoolStruct
          poolCache.set(m.symbol.toUpperCase(), pool)
          poolCache.set(m.symbol.toLowerCase(), pool)
        } catch {
          // If chain call fails, build partial struct from API data
          if (m.pool) {
            poolCache.set(m.symbol.toUpperCase(), m.pool)
          }
        }
      }
    }
  } catch {
    // Pool cache unavailable — raw flags required
  }
  return poolCache
}

export interface RawPoolOpts {
  baseCurrency?: string
  quoteCurrency?: string
  orderBook?: string
}

export async function resolvePool(symbol?: string, raw?: RawPoolOpts): Promise<PoolStruct> {
  // Prefer raw addresses if all three are provided
  if (raw?.baseCurrency && raw?.quoteCurrency && raw?.orderBook) {
    return {
      baseCurrency: raw.baseCurrency as Address,
      quoteCurrency: raw.quoteCurrency as Address,
      orderBook: raw.orderBook as Address,
    }
  }

  // Try symbol resolution
  if (symbol) {
    const cache = await buildPoolCache()
    const pool = cache.get(symbol.toUpperCase()) ?? cache.get(symbol.toLowerCase())
    if (pool) return pool

    // If raw baseCurrency + quoteCurrency provided, fetch from chain
    if (raw?.baseCurrency && raw?.quoteCurrency) {
      const contracts = getContracts()
      const pool = await publicClient().readContract({
        address: contracts.poolManager,
        abi: PoolManagerABI,
        functionName: 'getPool',
        args: [{ baseCurrency: raw.baseCurrency as Address, quoteCurrency: raw.quoteCurrency as Address }],
      }) as PoolStruct
      return pool
    }

    throw new Error(`Pool not found for symbol "${symbol}". Use --base-currency, --quote-currency, --order-book to specify directly.`)
  }

  // No symbol, no raw — try partial raw
  if (raw?.baseCurrency && raw?.quoteCurrency) {
    const contracts = getContracts()
    const pool = await publicClient().readContract({
      address: contracts.poolManager,
      abi: PoolManagerABI,
      functionName: 'getPool',
      args: [{ baseCurrency: raw.baseCurrency as Address, quoteCurrency: raw.quoteCurrency as Address }],
    }) as PoolStruct
    return pool
  }

  throw new Error('Must provide --symbol or --base-currency + --quote-currency + --order-book')
}
