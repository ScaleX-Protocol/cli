/**
 * Contract addresses by chain ID and waitForTx helper.
 * Env vars override built-in addresses.
 */

import type { Address, Hash } from 'viem'
import { publicClient } from './chain.js'

export interface ChainContracts {
  router: Address
  balanceManager: Address
  poolManager: Address
  agentRouter: Address
  pricePrediction: Address
  tokenRegistry: Address
}

const CHAIN_CONTRACTS: Record<number, ChainContracts> = {
  // Base Sepolia
  84532: {
    router:          '0xc02dCE91749Db64f349ef3029E6d9b565454688B',
    balanceManager:  '0xfE938b282ac5914A9e6F6AD39bAb73379D4Ad46D',
    poolManager:     '0x5F1E83f33fD58ab4c142b35BeBEC8cA941912b59',
    agentRouter:     '0x489981A135bD968df5A00FDE514298F9a87f5772',
    pricePrediction: '0x5f3735f44AC391467110010BBdB0B8928f0D8f1c',
    tokenRegistry:   '0x74C8ECB25EE920986142EB2BC7a01812C1CE1d03',
  },
  // Anvil local
  31337: {
    router:          '0xdc64a140aa3e981100a9beca4e685f962f0cf6c9',
    balanceManager:  '0x0000000000000000000000000000000000000000',
    poolManager:     '0x0000000000000000000000000000000000000000',
    agentRouter:     '0x0000000000000000000000000000000000000000',
    pricePrediction: '0x0000000000000000000000000000000000000000',
    tokenRegistry:   '0x0000000000000000000000000000000000000000',
  },
  // Rise Sepolia
  11155931: {
    router:          '0x8ae6fde2da2716f31a44b393f5ac627dc1d10ef1',
    balanceManager:  '0x0000000000000000000000000000000000000000',
    poolManager:     '0x0000000000000000000000000000000000000000',
    agentRouter:     '0x0000000000000000000000000000000000000000',
    pricePrediction: '0x0000000000000000000000000000000000000000',
    tokenRegistry:   '0x0000000000000000000000000000000000000000',
  },
  // Rari Testnet
  1918988905: {
    router:          '0xF38489749c3e65c82a9273c498A8c6614c34754b',
    balanceManager:  '0xd7fEF09a6cBd62E3f026916CDfE415b1e64f4Eb5',
    poolManager:     '0xA3B22cA94Cc3Eb8f6Bd8F4108D88d085e12d886b',
    agentRouter:     '0x0000000000000000000000000000000000000000',
    pricePrediction: '0x0000000000000000000000000000000000000000',
    tokenRegistry:   '0x0000000000000000000000000000000000000000',
  },
}

export function getContracts(chainId = Number(process.env.CHAIN_ID ?? 84532)): ChainContracts {
  const base = CHAIN_CONTRACTS[chainId]
  if (!base) throw new Error(`No built-in contracts for chain ${chainId}. Set SCALEX_ROUTER, SCALEX_BALANCE_MANAGER, etc. as env vars.`)
  return {
    router:          (process.env.SCALEX_ROUTER          ?? base.router)          as Address,
    balanceManager:  (process.env.SCALEX_BALANCE_MANAGER ?? base.balanceManager)  as Address,
    poolManager:     (process.env.SCALEX_POOL_MANAGER    ?? base.poolManager)     as Address,
    agentRouter:     (process.env.SCALEX_AGENT_ROUTER    ?? base.agentRouter)     as Address,
    pricePrediction: (process.env.SCALEX_PREDICTION      ?? base.pricePrediction) as Address,
    tokenRegistry:   (process.env.SCALEX_TOKEN_REGISTRY  ?? base.tokenRegistry)   as Address,
  }
}

export type TxReceipt = {
  transactionHash: string
  blockNumber: number
  status: 'success' | 'reverted'
  gasUsed: string
}

export async function waitForTx(hash: Hash): Promise<TxReceipt> {
  const receipt = await publicClient().waitForTransactionReceipt({ hash })
  return {
    transactionHash: receipt.transactionHash,
    blockNumber: Number(receipt.blockNumber),
    status: receipt.status === 'success' ? 'success' : 'reverted',
    gasUsed: receipt.gasUsed.toString(),
  }
}

export function getAgentTokenId(): bigint {
  const id = process.env.SCALEX_AGENT_TOKEN_ID
  if (!id) throw new Error('SCALEX_AGENT_TOKEN_ID is not set. Required for AgentRouter commands.')
  return BigInt(id)
}
