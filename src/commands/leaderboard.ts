import { Cli, z } from 'incur'
import { fetchAPI } from '../lib/api.js'

export const leaderboard = Cli.create('leaderboard', { description: 'Leaderboard — ranked users and agents by PnL, volume' })
  .command('get', {
    description: 'Get ranked leaderboard of users or agents',
    options: z.object({
      type:    z.enum(['user', 'agent']).optional().describe('Leaderboard type'),
      sortBy:  z.enum(['pnl', 'volume', 'users']).optional().describe('Sort metric'),
      window:  z.enum(['24h', '7d', '30d', 'all']).optional().describe('Time window'),
      chainId: z.number().optional().describe('Chain ID'),
      limit:   z.number().optional().default(20).describe('Max entries to return'),
      offset:  z.number().optional().default(0).describe('Pagination offset'),
    }),
    async run(c) {
      return fetchAPI('/api/leaderboard', c.options)
    },
  })
