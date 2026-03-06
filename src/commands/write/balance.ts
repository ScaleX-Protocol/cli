/**
 * BalanceManager write commands.
 * Direct deposit/withdraw to the DEX balance manager.
 */

import { Cli, z } from 'incur'
import { parseUnits, type Address } from 'viem'
import { getWalletClient, getWalletAddress, publicClient } from '../../lib/chain.js'
import { getContracts, waitForTx } from '../../lib/contracts.js'
import { BalanceManagerABI, ERC20ABI } from '../../lib/abis.js'

async function getDecimals(token: Address): Promise<number> {
  return publicClient().readContract({ address: token, abi: ERC20ABI, functionName: 'decimals' }) as Promise<number>
}

export const balance = Cli.create('balance', { description: 'BalanceManager — deposit and withdraw tokens from the DEX' })
  .command('deposit', {
    description: 'Deposit tokens into the DEX BalanceManager',
    options: z.object({
      token:  z.string().describe('Token contract address'),
      amount: z.string().describe('Amount to deposit in human-readable units'),
      user:   z.string().optional().describe('Recipient address (default: caller wallet)'),
    }),
    async run(c) {
      const wallet = getWalletClient()
      const contracts = getContracts()
      const decimals = await getDecimals(c.options.token as Address)
      const amountRaw = parseUnits(c.options.amount, decimals)
      const user = (c.options.user ?? getWalletAddress()) as Address
      const sender = getWalletAddress()

      // Approve BalanceManager to spend tokens first
      const allowance = await publicClient().readContract({
        address: c.options.token as Address,
        abi: ERC20ABI,
        functionName: 'allowance',
        args: [sender, contracts.balanceManager],
      }) as bigint

      if (allowance < amountRaw) {
        const approveHash = await wallet.writeContract({
          address: c.options.token as Address,
          abi: ERC20ABI,
          functionName: 'approve',
          args: [contracts.balanceManager, amountRaw * 2n],
        })
        await waitForTx(approveHash)
      }

      const hash = await wallet.writeContract({
        address: contracts.balanceManager,
        abi: BalanceManagerABI,
        functionName: 'deposit',
        args: [c.options.token as Address, amountRaw, sender, user],
      })
      return { ...(await waitForTx(hash)), token: c.options.token, amount: c.options.amount, user }
    },
  })
  .command('withdraw', {
    description: 'Withdraw tokens from the DEX BalanceManager to caller wallet',
    options: z.object({
      token:  z.string().describe('Token contract address'),
      amount: z.string().describe('Amount to withdraw in human-readable units'),
    }),
    async run(c) {
      const wallet = getWalletClient()
      const contracts = getContracts()
      const decimals = await getDecimals(c.options.token as Address)
      const amountRaw = parseUnits(c.options.amount, decimals)

      const hash = await wallet.writeContract({
        address: contracts.balanceManager,
        abi: BalanceManagerABI,
        functionName: 'withdraw',
        args: [c.options.token as Address, amountRaw],
      })
      return { ...(await waitForTx(hash)), token: c.options.token, amount: c.options.amount }
    },
  })
