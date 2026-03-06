import { Cli, z } from 'incur'
import { fetchAPI } from '../lib/api.js'

export const predictions = Cli.create('predictions', { description: 'Prediction markets — markets, positions, stats, events' })
  .command('markets', {
    description: 'List prediction markets',
    options: z.object({
      status:  z.enum(['active', 'resolved', 'cancelled']).optional().describe('Market status filter'),
      chainId: z.number().optional().describe('Chain ID'),
      limit:   z.number().optional().default(50).describe('Max markets to return'),
    }),
    async run(c) {
      return fetchAPI('/api/predictions/markets', c.options)
    },
  })
  .command('stats', {
    description: 'Get platform-wide prediction market statistics',
    options: z.object({
      chainId: z.number().optional().describe('Chain ID'),
    }),
    async run(c) {
      return fetchAPI('/api/predictions/stats', c.options)
    },
  })
  .command('events', {
    description: 'Get events for a specific prediction market',
    options: z.object({
      marketId: z.string().describe('Prediction market ID'),
      limit:    z.number().optional().default(50).describe('Max events to return'),
    }),
    async run(c) {
      return fetchAPI(`/api/predictions/events/${c.options.marketId}`, { limit: c.options.limit })
    },
  })
  .command('positions', {
    description: "Get a user's prediction market positions",
    options: z.object({
      userAddress: z.string().describe('Wallet address'),
      onlyActive:  z.boolean().optional().describe('Return only active positions'),
      chainId:     z.number().optional().describe('Chain ID'),
    }),
    async run(c) {
      return fetchAPI(`/api/predictions/positions/${c.options.userAddress}`, {
        onlyActive: c.options.onlyActive,
        chainId:    c.options.chainId,
      })
    },
  })
  .command('market-positions', {
    description: 'Get positions for a specific prediction market',
    options: z.object({
      marketId:    z.string().describe('Prediction market ID'),
      userAddress: z.string().optional().describe('Filter by wallet address'),
      chainId:     z.number().optional().describe('Chain ID'),
    }),
    async run(c) {
      return fetchAPI(`/api/predictions/markets/${c.options.marketId}/positions`, {
        userAddress: c.options.userAddress,
        chainId:     c.options.chainId,
      })
    },
  })
  .command('pending', {
    description: 'Get pending prediction actions (claimable positions) for an address',
    options: z.object({
      address: z.string().describe('Wallet address'),
    }),
    async run(c) {
      return fetchAPI(`/api/predictions/pending/${c.options.address}`)
    },
  })
