import { Cli, z } from 'incur'
import { fetchAPI } from '../lib/api.js'

export const lending = Cli.create('lending', { description: 'Lending protocol — platform stats and user dashboard' })
  .command('stats', {
    description: 'Get platform-wide lending statistics (rates, TVL, pools)',
    options: z.object({
      chainId: z.number().optional().describe('Chain ID (default: 84532)'),
    }),
    async run(c) {
      return fetchAPI('/api/lending/stats', c.options)
    },
  })
  .command('dashboard', {
    description: 'Get lending positions, supplies, borrows and activity for a user',
    options: z.object({
      user:    z.string().describe('Wallet address'),
      chainId: z.number().optional().describe('Chain ID (default: 84532)'),
    }),
    async run(c) {
      return fetchAPI(`/api/lending/dashboard/${c.options.user}`, { chainId: c.options.chainId })
    },
  })
