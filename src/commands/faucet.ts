import { Cli, z } from 'incur'
import { fetchAPI, postAPI } from '../lib/api.js'

export const faucet = Cli.create('faucet', { description: 'Testnet faucet — request test tokens and ETH' })
  .command('address', {
    description: 'Get faucet contract address for a chain',
    options: z.object({
      chainId: z.number().optional().default(31337).describe('Chain ID'),
    }),
    async run(c) {
      return fetchAPI('/api/faucet/address', c.options)
    },
  })
  .command('request', {
    description: 'Request ERC20 test tokens from the faucet',
    options: z.object({
      address:      z.string().describe('Recipient wallet address'),
      tokenAddress: z.string().describe('Token contract address to request'),
      chainId:      z.number().optional().describe('Chain ID'),
    }),
    async run(c) {
      const { address, tokenAddress, chainId } = c.options
      return postAPI('/api/faucet/request', { address, tokenAddress }, { chainId })
    },
  })
  .command('native-request', {
    description: 'Request native ETH from the faucet',
    options: z.object({
      address: z.string().describe('Recipient wallet address'),
      chainId: z.number().optional().describe('Chain ID'),
    }),
    async run(c) {
      const { address, chainId } = c.options
      return postAPI('/api/faucet/native-request', { address }, { chainId })
    },
  })
  .command('history', {
    description: 'Get faucet request history',
    options: z.object({
      address: z.string().optional().describe('Filter by wallet address'),
      chainId: z.number().optional().describe('Chain ID'),
      limit:   z.number().optional().default(20).describe('Max records to return'),
    }),
    async run(c) {
      return fetchAPI('/api/faucet/history', c.options)
    },
  })
