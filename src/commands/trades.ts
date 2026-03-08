import { Cli, z } from 'incur'
import { fetchAPI } from '../lib/api.js'

export const trades = Cli.create('trades', { description: 'Trade data — initial state, orders, price, ticker (legacy routes)' })
  .command('initial', {
    description: 'Get initial trade data for a symbol (order book + recent trades)',
    options: z.object({
      symbol:  z.string().describe('Trading pair, e.g. ETH-USDC'),
      address: z.string().regex(/^0x[a-fA-F0-9]{40}$/, 'must be a valid Ethereum address (0x followed by 40 hex characters)').describe('Wallet address to include user orders'),
    }),
    async run(c) {
      return fetchAPI(`/trades/${c.options.symbol}`, { address: c.options.address })
    },
  })
  .command('orders', {
    description: 'Get open orders for a symbol',
    options: z.object({
      symbol:  z.string().describe('Trading pair, e.g. ETH-USDC'),
      address: z.string().regex(/^0x[a-fA-F0-9]{40}$/, 'must be a valid Ethereum address (0x followed by 40 hex characters)').describe('Wallet address to filter orders'),
    }),
    async run(c) {
      return fetchAPI(`/trades/${c.options.symbol}/orders`, { address: c.options.address })
    },
  })
  .command('price', {
    description: 'Get current price for a symbol',
    options: z.object({
      symbol: z.string().describe('Trading pair, e.g. ETH-USDC'),
    }),
    async run(c) {
      return fetchAPI(`/trades/${c.options.symbol}/price`)
    },
  })
  .command('ticker', {
    description: 'Get 24hr ticker data for a symbol',
    options: z.object({
      symbol: z.string().describe('Trading pair, e.g. ETH-USDC'),
    }),
    async run(c) {
      return fetchAPI(`/trades/${c.options.symbol}/ticker`)
    },
  })
