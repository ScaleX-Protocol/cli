import { Cli, z } from 'incur'
import { fetchAPI } from '../lib/api.js'

export const currencies = Cli.create('currencies', { description: 'Supported currencies and token details' })
  .command('list', {
    description: 'List all supported currencies',
    options: z.object({}),
    async run() {
      return fetchAPI('/api/currencies')
    },
  })
  .command('get', {
    description: 'Get currency details by token address',
    options: z.object({
      address: z.string().describe('Token contract address'),
    }),
    async run(c) {
      return fetchAPI(`/api/currencies/${c.options.address}`)
    },
  })
