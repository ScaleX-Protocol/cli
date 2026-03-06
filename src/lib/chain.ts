/**
 * Viem client setup.
 * publicClient() is lazy — safe to import without CHAIN_ID set.
 * getWalletClient() throws immediately if PRIVATE_KEY is missing.
 */

import {
  createPublicClient,
  createWalletClient,
  defineChain,
  http,
  type Address,
} from 'viem'
import { privateKeyToAccount } from 'viem/accounts'

function getChainConfig() {
  const chainId = Number(process.env.CHAIN_ID ?? 84532)
  const rpcUrl = process.env.RPC_URL ?? 'https://sepolia.base.org'
  const chainName = process.env.SCALEX_CHAIN_NAME ?? 'base-sepolia'
  return { chainId, rpcUrl, chainName }
}

let _publicClient: ReturnType<typeof createPublicClient> | null = null

export function publicClient() {
  if (!_publicClient) {
    const { chainId, rpcUrl, chainName } = getChainConfig()
    const chain = defineChain({
      id: chainId,
      name: chainName,
      nativeCurrency: { name: 'ETH', symbol: 'ETH', decimals: 18 },
      rpcUrls: { default: { http: [rpcUrl] } },
    })
    _publicClient = createPublicClient({ chain, transport: http(rpcUrl) })
  }
  return _publicClient
}

export function getWalletClient() {
  const pk = process.env.PRIVATE_KEY as `0x${string}` | undefined
  if (!pk) throw new Error('PRIVATE_KEY is not set. Required for write commands.')

  const { chainId, rpcUrl, chainName } = getChainConfig()
  const chain = defineChain({
    id: chainId,
    name: chainName,
    nativeCurrency: { name: 'ETH', symbol: 'ETH', decimals: 18 },
    rpcUrls: { default: { http: [rpcUrl] } },
  })
  const account = privateKeyToAccount(pk)
  return createWalletClient({ account, chain, transport: http(rpcUrl) })
}

export function getWalletAddress(): Address {
  const pk = process.env.PRIVATE_KEY as `0x${string}` | undefined
  if (!pk) throw new Error('PRIVATE_KEY is not set.')
  return privateKeyToAccount(pk).address
}
