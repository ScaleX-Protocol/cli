import { Cli, z } from 'incur'
import { fetchAPI } from '../lib/api.js'

export const activity = Cli.create('activity', { description: 'Unified activity history — trading, lending, transfers, agents, predictions' })
  .command('get', {
    description: 'Get unified activity history for a wallet address',
    options: z.object({
      address: z.string().describe('Wallet address'),
      type:    z.enum(['trading', 'lending', 'transfer', 'agent', 'prediction']).optional().describe('Activity type filter'),
      period:  z.enum(['24h', '7d', '30d']).optional().describe('Time period filter'),
      limit:   z.number().optional().default(50).describe('Max activities to return'),
      offset:  z.number().optional().default(0).describe('Pagination offset'),
      chainId: z.number().optional().describe('Chain ID'),
    }),
    async run(c) {
      const { address, ...params } = c.options
      return fetchAPI(`/api/activity/${address}`, params)
    },
  })
