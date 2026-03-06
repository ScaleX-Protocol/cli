import { Cli, z } from 'incur'
import { fetchAPI } from '../lib/api.js'

export const market = Cli.create('market', { description: 'Market data — kline, depth, trades, ticker, pairs' })
  .command('kline', {
    description: 'Get candlestick/OHLCV data for a trading pair',
    options: z.object({
      symbol:    z.string().describe('Trading pair, e.g. ETH-USDC'),
      interval:  z.enum(['1m', '5m', '30m', '1h', '1d']).optional().default('1m').describe('Candle interval'),
      startTime: z.number().optional().describe('Start time in milliseconds'),
      endTime:   z.number().optional().describe('End time in milliseconds'),
      limit:     z.number().optional().default(100).describe('Number of candles to return'),
    }),
    async run(c) {
      return fetchAPI('/api/kline', c.options)
    },
  })
  .command('depth', {
    description: 'Get order book depth (bids and asks) for a symbol',
    options: z.object({
      symbol: z.string().describe('Trading pair, e.g. ETH-USDC'),
      limit:  z.number().optional().default(20).describe('Depth levels per side'),
    }),
    async run(c) {
      return fetchAPI('/api/depth', c.options)
    },
  })
  .command('trades', {
    description: 'Get recent trades for a symbol',
    options: z.object({
      symbol:  z.string().describe('Trading pair, e.g. ETH-USDC'),
      limit:   z.number().optional().default(50).describe('Max trades to return'),
      user:    z.string().optional().describe('Filter by wallet address'),
      orderBy: z.enum(['asc', 'desc']).optional().describe('Sort order'),
    }),
    async run(c) {
      return fetchAPI('/api/trades', c.options)
    },
  })
  .command('ticker-24hr', {
    description: 'Get 24-hour ticker stats for a symbol',
    options: z.object({
      symbol: z.string().describe('Trading pair, e.g. ETH-USDC'),
    }),
    async run(c) {
      return fetchAPI('/api/ticker/24hr', c.options)
    },
  })
  .command('ticker-all', {
    description: 'Get 24-hour ticker stats for all trading pairs',
    options: z.object({}),
    async run() {
      return fetchAPI('/api/ticker/24hr/all')
    },
  })
  .command('ticker-price', {
    description: 'Get current price for a symbol',
    options: z.object({
      symbol: z.string().describe('Trading pair, e.g. ETH-USDC'),
    }),
    async run(c) {
      return fetchAPI('/api/ticker/price', c.options)
    },
  })
  .command('pairs', {
    description: 'List all trading pairs',
    options: z.object({}),
    async run() {
      return fetchAPI('/api/pairs')
    },
  })
  .command('markets', {
    description: 'List all markets with pool details',
    options: z.object({}),
    async run() {
      return fetchAPI('/api/markets')
    },
  })
