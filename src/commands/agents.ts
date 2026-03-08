import { Cli, z } from 'incur'
import { fetchAPI } from '../lib/api.js'

export const agents = Cli.create('agents', { description: 'Agent registry — list, stats, policy, orders, analytics' })
  .command('whoami', {
    description: 'Show the currently configured agent identity (from env)',
    options: z.object({}),
    async run() {
      const agentTokenId = process.env.SCALEX_AGENT_TOKEN_ID
      const privateKey   = process.env.PRIVATE_KEY

      // Derive wallet address from private key if set
      let walletAddress: string | undefined
      if (privateKey) {
        const { privateKeyToAccount } = await import('viem/accounts')
        walletAddress = privateKeyToAccount(privateKey as `0x${string}`).address
      }

      if (!agentTokenId) {
        return {
          configured: false,
          walletAddress: walletAddress ?? '(PRIVATE_KEY not set)',
          agentTokenId: null,
          note: 'Set SCALEX_AGENT_TOKEN_ID in .env to identify the active agent',
        }
      }

      const [info, stats, orders] = await Promise.all([
        fetchAPI(`/api/agents/${agentTokenId}`),
        fetchAPI(`/api/agents/${agentTokenId}/stats`),
        fetchAPI(`/api/agents/${agentTokenId}/orders`, { status: 'open', limit: 1 }),
      ])

      return {
        configured: true,
        walletAddress: walletAddress ?? '(PRIVATE_KEY not set)',
        agentTokenId,
        info,
        stats,
        openOrders: (orders as any)?.count ?? 0,
      }
    },
  })
  .command('list', {
    description: 'List registered agents',
    options: z.object({
      owner:   z.string().optional().describe('Filter by owner wallet address'),
      chainId: z.number().optional().describe('Chain ID (default: 84532)'),
      limit:   z.number().optional().default(20).describe('Max agents to return'),
      offset:  z.number().optional().default(0).describe('Pagination offset'),
    }),
    async run(c) {
      return fetchAPI('/api/agents', { owner: c.options.owner, chainId: c.options.chainId, limit: c.options.limit, offset: c.options.offset })
    },
  })
  .command('get', {
    description: 'Get agent details by token ID',
    options: z.object({
      agentTokenId: z.string().describe('Agent NFT token ID'),
    }),
    async run(c) {
      return fetchAPI(`/api/agents/${c.options.agentTokenId}`)
    },
  })
  .command('stats', {
    description: 'Get trading statistics for an agent',
    options: z.object({
      agentTokenId: z.string().describe('Agent NFT token ID'),
    }),
    async run(c) {
      return fetchAPI(`/api/agents/${c.options.agentTokenId}/stats`)
    },
  })
  .command('lending', {
    description: 'Get lending data for an agent',
    options: z.object({
      agentTokenId: z.string().describe('Agent NFT token ID'),
    }),
    async run(c) {
      return fetchAPI(`/api/agents/${c.options.agentTokenId}/lending`)
    },
  })
  .command('policy', {
    description: 'Get policy configuration for an agent',
    options: z.object({
      agentTokenId: z.string().describe('Agent NFT token ID'),
    }),
    async run(c) {
      return fetchAPI(`/api/agents/${c.options.agentTokenId}/policy`)
    },
  })
  .command('users', {
    description: 'Get users who have authorized an agent',
    options: z.object({
      agentTokenId: z.string().describe('Agent NFT token ID'),
      enabled:      z.boolean().optional().describe('Filter by enabled status'),
      owner:        z.string().optional().describe('Filter by owner address'),
      chainId:      z.number().optional().describe('Chain ID'),
      limit:        z.number().optional().default(20).describe('Max users to return'),
      offset:       z.number().optional().default(0).describe('Pagination offset'),
    }),
    async run(c) {
      const { agentTokenId, ...params } = c.options
      return fetchAPI(`/api/agents/${agentTokenId}/users`, params)
    },
  })
  .command('orders', {
    description: 'Get orders placed by an agent',
    options: z.object({
      agentTokenId: z.string().describe('Agent NFT token ID'),
      status:       z.enum(['open', 'filled', 'partially_filled', 'cancelled']).optional().describe('Order status filter'),
      chainId:      z.number().optional().describe('Chain ID'),
      limit:        z.number().optional().default(20).describe('Max orders to return'),
      offset:       z.number().optional().default(0).describe('Pagination offset'),
    }),
    async run(c) {
      const { agentTokenId, ...params } = c.options
      return fetchAPI(`/api/agents/${agentTokenId}/orders`, params)
    },
  })
  .command('violations', {
    description: 'Get policy violations for an agent',
    options: z.object({
      agentTokenId: z.string().describe('Agent NFT token ID'),
      chainId:      z.number().optional().describe('Chain ID'),
      limit:        z.number().optional().default(20).describe('Max violations to return'),
      offset:       z.number().optional().default(0).describe('Pagination offset'),
    }),
    async run(c) {
      const { agentTokenId, ...params } = c.options
      return fetchAPI(`/api/agents/${agentTokenId}/violations`, params)
    },
  })
  .command('circuit-breakers', {
    description: 'Get circuit breaker events for an agent',
    options: z.object({
      agentTokenId: z.string().describe('Agent NFT token ID'),
      chainId:      z.number().optional().describe('Chain ID'),
      limit:        z.number().optional().default(20).describe('Max events to return'),
      offset:       z.number().optional().default(0).describe('Pagination offset'),
    }),
    async run(c) {
      const { agentTokenId, ...params } = c.options
      return fetchAPI(`/api/agents/${agentTokenId}/circuit-breakers`, params)
    },
  })
  .command('predictions', {
    description: 'Get prediction market events for an agent',
    options: z.object({
      agentTokenId: z.string().describe('Agent NFT token ID'),
      action:       z.enum(['PREDICT', 'CLAIM']).optional().describe('Filter by action type'),
      chainId:      z.number().optional().describe('Chain ID'),
      limit:        z.number().optional().default(20).describe('Max events to return'),
      offset:       z.number().optional().default(0).describe('Pagination offset'),
    }),
    async run(c) {
      const { agentTokenId, ...params } = c.options
      return fetchAPI(`/api/agents/${agentTokenId}/predictions`, params)
    },
  })
  .command('analytics', {
    description: 'Get PnL and trading analytics for an agent',
    options: z.object({
      agentTokenId: z.string().describe('Agent NFT token ID'),
      window:       z.enum(['24h', '7d', '30d', 'all']).optional().describe('Time window'),
      chainId:      z.number().optional().describe('Chain ID'),
    }),
    async run(c) {
      const { agentTokenId, ...params } = c.options
      return fetchAPI(`/api/agents/${agentTokenId}/analytics`, params)
    },
  })
  .command('all-orders', {
    description: 'List all agent-placed orders across all agents (cross-agent view)',
    options: z.object({
      chainId:  z.number().optional().default(84532).describe('Chain ID (default: 84532 Base Sepolia)'),
      owner:    z.string().optional().describe('Filter by agent owner address'),
      executor: z.string().optional().describe('Filter by executor address'),
      status:   z.enum(['open', 'filled', 'partially_filled', 'cancelled', 'rejected']).optional().describe('Order status filter'),
      limit:    z.number().optional().default(20).describe('Max orders to return'),
      offset:   z.number().optional().default(0).describe('Pagination offset'),
    }),
    async run(c) {
      return fetchAPI('/api/agent-orders', c.options)
    },
  })
