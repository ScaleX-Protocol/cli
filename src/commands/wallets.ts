import { Cli, z } from 'incur'
import { fetchAPI } from '../lib/api.js'

export const wallets = Cli.create('wallets', { description: 'Wallet registry — list and get wallet details' })
  .command('list', {
    description: 'List all indexed wallets',
    options: z.object({
      indices: z.string().regex(/^[0-9,\-]+$/, "must be a range string like '0-19' or '0,2,5'").optional().describe("Wallet index range, e.g. '0-19' for first 20, '0,2,5' for specific indices"),
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
