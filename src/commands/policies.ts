import { Cli, z } from 'incur'
import { fetchAPI } from '../lib/api.js'

export const policies = Cli.create('policies', { description: 'Agent policies — installed agents and user analytics' })
  .command('list', {
    description: 'Get all policies (installed agents) for a wallet owner',
    options: z.object({
      owner:   z.string().describe('Owner wallet address'),
      chainId: z.number().optional().describe('Chain ID (default: 84532)'),
    }),
    async run(c) {
      return fetchAPI('/api/policies', c.options)
    },
  })
  .command('user-analytics', {
    description: 'Get PnL, win rates, and pool-level analytics for a user',
    options: z.object({
      address: z.string().describe('Wallet address'),
      window:  z.enum(['24h', '7d', '30d', 'all']).optional().describe('Time window'),
      chainId: z.number().optional().describe('Chain ID'),
    }),
    async run(c) {
      const { address, ...params } = c.options
      return fetchAPI(`/api/users/${address}/analytics`, params)
    },
  })
