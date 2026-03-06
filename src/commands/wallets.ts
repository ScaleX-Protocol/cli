import { Cli, z } from 'incur'
import { fetchAPI } from '../lib/api.js'

export const wallets = Cli.create('wallets', { description: 'Wallet registry — list and get wallet details' })
  .command('list', {
    description: 'List all indexed wallets',
    options: z.object({
      limit:  z.number().optional().default(20).describe('Max wallets to return'),
      offset: z.number().optional().default(0).describe('Pagination offset'),
    }),
    async run(c) {
      return fetchAPI('/wallets', c.options)
    },
  })
  .command('get', {
    description: 'Get wallet details by address',
    options: z.object({
      address: z.string().describe('Wallet address'),
    }),
    async run(c) {
      return fetchAPI(`/wallets/${c.options.address}`)
    },
  })
