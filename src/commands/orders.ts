import { Cli, z } from 'incur'
import { fetchAPI } from '../lib/api.js'

export const orders = Cli.create('orders', { description: 'Order management — view all, open, and account orders' })
  .command('all', {
    description: 'Get all orders for a wallet address',
    options: z.object({
      address: z.string().describe('Wallet address'),
      symbol:  z.string().optional().describe('Filter by trading pair, e.g. ETH-USDC'),
      limit:   z.number().optional().default(50).describe('Max orders to return'),
    }),
    async run(c) {
      return fetchAPI('/api/allOrders', c.options)
    },
  })
  .command('open', {
    description: 'Get open orders for a wallet address',
    options: z.object({
      address: z.string().describe('Wallet address'),
      symbol:  z.string().optional().describe('Filter by trading pair, e.g. ETH-USDC'),
    }),
    async run(c) {
      return fetchAPI('/api/openOrders', c.options)
    },
  })
  .command('account', {
    description: 'Get account details including balances for a wallet address',
    options: z.object({
      address: z.string().describe('Wallet address'),
    }),
    async run(c) {
      return fetchAPI('/api/account', c.options)
    },
  })
