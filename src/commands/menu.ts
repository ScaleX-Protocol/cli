/**
 * Interactive menu for ScaleX CLI.
 * Run: scalex menu
 */

import { z } from 'incur'
import * as p from '@clack/prompts'
import { fetchAPI } from '../lib/api.js'

// ── Brand colors (#F06718 — primary orange from frontend) ─────────────────────

const R = '\x1b[0m'                             // reset
const orange  = (s: string) => `\x1b[38;2;240;103;24m${s}${R}`
const orangeBg = (s: string) => `\x1b[48;2;240;103;24m\x1b[38;2;20;20;20m${s}${R}`
const dim     = (s: string) => `\x1b[2m${s}${R}`
const bold    = (s: string) => `\x1b[1m${s}${R}`
const white   = (s: string) => `\x1b[97m${s}${R}`

async function printHeader() {
  const agentId = process.env.SCALEX_AGENT_TOKEN_ID
  const pk      = process.env.PRIVATE_KEY

  let agentLabel = dim('no agent configured')
  if (agentId && pk) {
    try {
      const { privateKeyToAccount } = await import('viem/accounts')
      const addr = privateKeyToAccount(pk as `0x${string}`).address
      const shortAddr = `${addr.slice(0, 6)}…${addr.slice(-4)}`

      // try to get agent name from list
      const listRes: any = await fetchAPI('/api/agents', { limit: 100 })
      const entry = listRes?.data?.find((a: any) => String(a.agentTokenId) === String(agentId))
      let name = `Agent #${agentId}`
      if (entry?.metadataURI) {
        try {
          const meta: any = await (await fetch(entry.metadataURI)).json()
          if (meta?.name) name = meta.name
        } catch {}
      }
      agentLabel = `${orange(name)}  ${dim(`#${agentId} · ${shortAddr}`)}`
    } catch {}
  }

  const width = 44
  const top    = `╔${'═'.repeat(width)}╗`
  const bottom = `╚${'═'.repeat(width)}╝`
  const pad    = (s: string, n: number) => s + ' '.repeat(Math.max(0, n - stripAnsi(s).length))

  const tag = dim('agent-native interface · Base Sepolia')

  console.log()
  console.log(dim(top))
  console.log(`${dim('║')} ${pad(orange(bold('ScaleX CLI')), width - 2)} ${dim('║')}`)
  console.log(`${dim('║')} ${pad(tag, width - 2)} ${dim('║')}`)
  console.log(`${dim('║')} ${pad(agentLabel, width - 2)} ${dim('║')}`)
  console.log(dim(bottom))
  console.log()
}

// strip ANSI codes to measure visible string length
function stripAnsi(s: string): string {
  return s.replace(/\x1b\[[0-9;]*m/g, '')
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function cancelled(v: unknown): boolean {
  return p.isCancel(v)
}

async function promptText(message: string, placeholder?: string): Promise<string | null> {
  const v = await p.text({ message, placeholder })
  return cancelled(v) ? null : (v as string)
}

async function promptNumber(message: string, defaultVal?: number): Promise<number | null> {
  const v = await p.text({
    message,
    placeholder: defaultVal !== undefined ? String(defaultVal) : undefined,
    defaultValue: defaultVal !== undefined ? String(defaultVal) : undefined,
  })
  if (cancelled(v)) return null
  const n = Number(v)
  return isNaN(n) ? (defaultVal ?? 0) : n
}

async function promptSelect<T extends string>(
  message: string,
  options: { value: T; label: string; hint?: string }[]
): Promise<T | null> {
  const v = await p.select({ message, options })
  return cancelled(v) ? null : (v as T)
}

// Convert camelCase to snake_case
function toSnake(s: string) {
  return s.replace(/[A-Z]/g, c => `_${c.toLowerCase()}`)
}

// Shorten hex strings and long values for display
function fmt(v: unknown): string {
  const s = String(v ?? '')
  // hex address/hash: shorten to 0x1234…abcd
  if (/^0x[a-fA-F0-9]{10,}$/.test(s)) return `${s.slice(0, 8)}…${s.slice(-4)}`
  return s
}

function printResult(data: unknown) {
  const payload = (data as any)?.data ?? data

  // Array → table
  if (Array.isArray(payload) && payload.length > 0 && typeof payload[0] === 'object') {
    const rows = payload as Record<string, unknown>[]
    const allKeys = Object.keys(rows[0])
    const snakeSet = new Set(allKeys.filter(k => k.includes('_')))

    // Drop camelCase keys that duplicate a snake_case key already present
    const keys = allKeys.filter(k => {
      if (!/[A-Z]/.test(k)) return true          // already snake/lower — keep
      return !snakeSet.has(toSnake(k))            // drop if snake twin exists
    })

    const MAX_COL = 20
    const cols = keys.map(k => ({
      key: k,
      width: Math.min(MAX_COL, Math.max(k.length, ...rows.map(r => fmt(r[k]).length))),
    }))

    const header = cols.map(c => orange(c.key.padEnd(c.width))).join('  ')
    const sep    = dim(cols.map(c => '─'.repeat(c.width)).join('──'))
    console.log('\n' + header)
    console.log(sep)
    for (const row of rows) {
      console.log(cols.map(c => fmt(row[c.key]).slice(0, c.width).padEnd(c.width)).join('  '))
    }
    console.log(dim(`\n  ${rows.length} row${rows.length === 1 ? '' : 's'}`))
    return
  }

  // Single object → key-value
  if (payload && typeof payload === 'object' && !Array.isArray(payload)) {
    const obj = payload as Record<string, unknown>
    const keyW = Math.max(...Object.keys(obj).map(k => k.length))
    console.log()
    for (const [k, v] of Object.entries(obj)) {
      const val = typeof v === 'object' ? JSON.stringify(v) : fmt(v)
      console.log(`  ${orange(k.padEnd(keyW))}  ${val}`)
    }
    console.log()
    return
  }

  console.log('\n' + JSON.stringify(payload, null, 2))
}

// ── Section handlers ─────────────────────────────────────────────────────────

async function menuAgents() {
  const cmd = await promptSelect('Agents', [
    { value: 'whoami',     label: 'whoami',      hint: 'current configured agent' },
    { value: 'list',       label: 'list',         hint: 'all registered agents' },
    { value: 'get',        label: 'get',          hint: 'agent details by token ID' },
    { value: 'stats',      label: 'stats',        hint: 'trading stats' },
    { value: 'orders',     label: 'orders',       hint: 'orders placed by agent' },
    { value: 'all-orders', label: 'all-orders',   hint: 'cross-agent order view' },
    { value: 'users',      label: 'users',        hint: 'users who authorized this agent' },
    { value: 'policy',     label: 'policy',       hint: 'policy configuration' },
    { value: 'analytics',  label: 'analytics',    hint: 'PnL analytics' },
  ])
  if (!cmd) return

  if (cmd === 'whoami') {
    const agentTokenId = process.env.SCALEX_AGENT_TOKEN_ID
    const privateKey   = process.env.PRIVATE_KEY
    let walletAddress: string | undefined
    if (privateKey) {
      const { privateKeyToAccount } = await import('viem/accounts')
      walletAddress = privateKeyToAccount(privateKey as `0x${string}`).address
    }
    if (!agentTokenId) {
      printResult({ configured: false, walletAddress, note: 'Set SCALEX_AGENT_TOKEN_ID in .env' })
      return
    }
    const s = p.spinner()
    s.start('Fetching agent identity…')
    const [listRes, stats, orders] = await Promise.all([
      fetchAPI('/api/agents', { limit: 100 }),
      fetchAPI(`/api/agents/${agentTokenId}/stats`),
      fetchAPI(`/api/agents/${agentTokenId}/orders`, { status: 'open', limit: 1 }),
    ])
    const listEntry = (listRes as any)?.data?.find((a: any) => String(a.agentTokenId) === String(agentTokenId))
    let metadata: any
    if (listEntry?.metadataURI) {
      try { metadata = await (await fetch(listEntry.metadataURI)).json() } catch {}
    }
    s.stop('Done')
    printResult({ walletAddress, agentTokenId, name: metadata?.name, description: metadata?.description, attributes: metadata?.attributes, stats: (stats as any)?.data, openOrders: (orders as any)?.count ?? 0 })
    return
  }

  if (cmd === 'list') {
    const limit = await promptNumber('Limit', 10)
    if (limit === null) return
    const s = p.spinner(); s.start('Fetching…')
    printResult(await fetchAPI('/api/agents', { limit }))
    s.stop('Done')
    return
  }

  if (cmd === 'all-orders') {
    const status = await promptSelect('Status filter', [
      { value: '', label: 'All' },
      { value: 'open', label: 'Open' },
      { value: 'filled', label: 'Filled' },
      { value: 'partially_filled', label: 'Partially filled' },
      { value: 'cancelled', label: 'Cancelled' },
      { value: 'rejected', label: 'Rejected' },
    ])
    const limit = await promptNumber('Limit', 20)
    if (limit === null) return
    const s = p.spinner(); s.start('Fetching…')
    const params: any = { limit }
    if (status) params.status = status
    printResult(await fetchAPI('/api/agent-orders', params))
    s.stop('Done')
    return
  }

  const agentTokenId = await promptText('Agent token ID', process.env.SCALEX_AGENT_TOKEN_ID ?? '1428')
  if (!agentTokenId) return

  if (cmd === 'get')      { const s = p.spinner(); s.start('Fetching…'); printResult(await fetchAPI(`/api/agents/${agentTokenId}`)); s.stop('Done') }
  if (cmd === 'stats')    { const s = p.spinner(); s.start('Fetching…'); printResult(await fetchAPI(`/api/agents/${agentTokenId}/stats`)); s.stop('Done') }
  if (cmd === 'policy')   { const s = p.spinner(); s.start('Fetching…'); printResult(await fetchAPI(`/api/agents/${agentTokenId}/policy`)); s.stop('Done') }
  if (cmd === 'analytics'){ const s = p.spinner(); s.start('Fetching…'); printResult(await fetchAPI(`/api/agents/${agentTokenId}/analytics`)); s.stop('Done') }

  if (cmd === 'orders') {
    const status = await promptSelect('Status filter', [
      { value: '', label: 'All' },
      { value: 'open', label: 'Open' },
      { value: 'filled', label: 'Filled' },
      { value: 'partially_filled', label: 'Partially filled' },
      { value: 'cancelled', label: 'Cancelled' },
    ])
    const limit = await promptNumber('Limit', 20)
    if (limit === null) return
    const s = p.spinner(); s.start('Fetching…')
    const params: any = { limit }
    if (status) params.status = status
    printResult(await fetchAPI(`/api/agents/${agentTokenId}/orders`, params))
    s.stop('Done')
  }

  if (cmd === 'users') {
    const limit = await promptNumber('Limit', 20)
    if (limit === null) return
    const s = p.spinner(); s.start('Fetching…')
    printResult(await fetchAPI(`/api/agents/${agentTokenId}/users`, { limit }))
    s.stop('Done')
  }
}

// Fetch markets list and let user pick one; returns poolId
async function pickMarket(): Promise<string | null> {
  const s = p.spinner(); s.start('Loading markets…')
  const res: any = await fetchAPI('/api/markets')
  s.stop('')
  const markets: any[] = Array.isArray(res) ? res : (res?.data ?? [])
  if (!markets.length) { p.log.error('No markets found'); return null }
  const choice = await promptSelect('Select market', markets.map((m: any) => ({
    value: m.poolId as string,
    label: m.symbol as string,
    hint: `price: ${m.latestPrice}`,
  })))
  return choice
}

async function menuMarket() {
  const cmd = await promptSelect('Market data', [
    { value: 'markets',     label: 'markets',     hint: 'all markets with pool details' },
    { value: 'pairs',       label: 'pairs',        hint: 'all trading pairs' },
    { value: 'ticker-all',  label: 'ticker-all',   hint: '24h ticker for all pairs' },
    { value: 'ticker-24hr', label: 'ticker-24hr',  hint: '24h ticker for a pair' },
    { value: 'ticker-price',label: 'ticker-price', hint: 'current price for a pair' },
    { value: 'depth',       label: 'depth',        hint: 'order book depth' },
    { value: 'trades',      label: 'trades',       hint: 'recent trades' },
    { value: 'kline',       label: 'kline',        hint: 'candlestick data' },
  ])
  if (!cmd) return

  if (cmd === 'markets') {
    const s = p.spinner(); s.start('Fetching…')
    printResult(await fetchAPI('/api/markets'))
    s.stop('Done')
    return
  }

  if (cmd === 'pairs') {
    const s = p.spinner(); s.start('Fetching…')
    printResult(await fetchAPI('/api/pairs'))
    s.stop('Done')
    return
  }

  if (cmd === 'ticker-all') {
    const s = p.spinner(); s.start('Fetching…')
    printResult(await fetchAPI('/api/ticker/24hr/all'))
    s.stop('Done')
    return
  }

  const poolId = await pickMarket()
  if (!poolId) return

  if (cmd === 'ticker-24hr') {
    const s = p.spinner(); s.start('Fetching…')
    printResult(await fetchAPI('/api/ticker/24hr', { symbol: poolId }))
    s.stop('Done')
    return
  }

  if (cmd === 'ticker-price') {
    const s = p.spinner(); s.start('Fetching…')
    printResult(await fetchAPI('/api/ticker/price', { symbol: poolId }))
    s.stop('Done')
    return
  }

  if (cmd === 'depth') {
    const s = p.spinner(); s.start('Fetching…')
    printResult(await fetchAPI('/api/depth', { symbol: poolId, limit: 10 }))
    s.stop('Done')
    return
  }

  if (cmd === 'trades') {
    const limit = await promptNumber('Limit', 20)
    if (limit === null) return
    const s = p.spinner(); s.start('Fetching…')
    printResult(await fetchAPI('/api/trades', { symbol: poolId, limit }))
    s.stop('Done')
    return
  }

  if (cmd === 'kline') {
    const interval = await promptSelect('Interval', [
      { value: '1m', label: '1m' }, { value: '5m', label: '5m' },
      { value: '30m', label: '30m' }, { value: '1h', label: '1h' },
      { value: '1d', label: '1d' },
    ])
    if (!interval) return
    const limit = await promptNumber('Limit', 50)
    if (limit === null) return
    const s = p.spinner(); s.start('Fetching…')
    printResult(await fetchAPI('/api/kline', { symbol: poolId, interval, limit }))
    s.stop('Done')
  }
}

async function menuOrders() {
  const cmd = await promptSelect('Orders', [
    { value: 'all',     label: 'all',     hint: 'all orders for an address' },
    { value: 'open',    label: 'open',    hint: 'open orders for an address' },
    { value: 'account', label: 'account', hint: 'account balances for an address' },
  ])
  if (!cmd) return

  const myAddr = process.env.PRIVATE_KEY
    ? (await import('viem/accounts')).privateKeyToAccount(process.env.PRIVATE_KEY as `0x${string}`).address
    : undefined

  const address = await promptText('Wallet address', myAddr ?? '')
  if (!address) return

  if (cmd === 'all') {
    const limit = await promptNumber('Limit', 20)
    if (limit === null) return
    const s = p.spinner(); s.start('Fetching…')
    printResult(await fetchAPI('/api/allOrders', { address, limit }))
    s.stop('Done')
    return
  }

  if (cmd === 'open') {
    const s = p.spinner(); s.start('Fetching…')
    printResult(await fetchAPI('/api/openOrders', { address }))
    s.stop('Done')
    return
  }

  if (cmd === 'account') {
    const s = p.spinner(); s.start('Fetching…')
    printResult(await fetchAPI('/api/account', { address }))
    s.stop('Done')
  }
}

async function menuPredictions() {
  const cmd = await promptSelect('Predictions', [
    { value: 'markets',   label: 'markets',   hint: 'list prediction markets' },
    { value: 'stats',     label: 'stats',     hint: 'platform stats' },
    { value: 'positions', label: 'positions', hint: 'user positions' },
  ])
  if (!cmd) return

  if (cmd === 'stats') {
    const s = p.spinner(); s.start('Fetching…')
    printResult(await fetchAPI('/api/predictions/stats'))
    s.stop('Done')
    return
  }

  if (cmd === 'markets') {
    const status = await promptSelect('Status', [
      { value: '', label: 'All' },
      { value: '0', label: 'Active' },
      { value: '2', label: 'Resolved' },
      { value: '3', label: 'Cancelled' },
    ])
    const limit = await promptNumber('Limit', 20)
    if (limit === null) return
    const s = p.spinner(); s.start('Fetching…')
    const params: any = { limit }
    if (status) params.status = Number(status)
    printResult(await fetchAPI('/api/predictions/markets', params))
    s.stop('Done')
    return
  }

  if (cmd === 'positions') {
    const address = await promptText('Wallet address')
    if (!address) return
    const s = p.spinner(); s.start('Fetching…')
    printResult(await fetchAPI(`/api/predictions/positions/${address}`))
    s.stop('Done')
  }
}

async function menuWallets() {
  const cmd = await promptSelect('Wallets', [
    { value: 'list', label: 'list', hint: 'list all indexed wallets' },
    { value: 'get',  label: 'get',  hint: 'wallet details by address' },
  ])
  if (!cmd) return

  if (cmd === 'list') {
    const indices = await promptText('Indices (e.g. 0-19)', '')
    const s = p.spinner(); s.start('Fetching…')
    const params: any = {}
    if (indices) params.indices = indices
    printResult(await fetchAPI('/wallets', params))
    s.stop('Done')
    return
  }

  const address = await promptText('Wallet address')
  if (!address) return
  const s = p.spinner(); s.start('Fetching…')
  printResult(await fetchAPI(`/wallets/${address}`))
  s.stop('Done')
}

async function menuLeaderboard() {
  const type = await promptSelect('Type', [
    { value: '', label: 'All' },
    { value: 'user', label: 'Users' },
    { value: 'agent', label: 'Agents' },
  ])
  if (type === null) return

  const sortBy = await promptSelect('Sort by', [
    { value: 'volume', label: 'Volume' },
    { value: 'pnl', label: 'PnL' },
  ])
  if (sortBy === null) return

  const window = await promptSelect('Window', [
    { value: 'all', label: 'All time' },
    { value: '24h', label: '24h' },
    { value: '7d', label: '7 days' },
    { value: '30d', label: '30 days' },
  ])
  if (window === null) return

  const limit = await promptNumber('Limit', 20)
  if (limit === null) return

  const params: any = { limit, sortBy, window }
  if (type) params.type = type

  const s = p.spinner(); s.start('Fetching…')
  printResult(await fetchAPI('/api/leaderboard', params))
  s.stop('Done')
}

// ── Main menu ─────────────────────────────────────────────────────────────────

export const menuCommand = {
  description: 'Interactive menu — browse and run commands with arrow keys',
  options: z.object({}),
  async run() {
      await printHeader()

      while (true) {
        const section = await promptSelect('Select a section', [
          { value: 'agents',      label: '🤖  Agents',       hint: 'identity, stats, orders' },
          { value: 'market',      label: '📈  Market',        hint: 'pairs, ticker, depth, kline' },
          { value: 'orders',      label: '📋  Orders',        hint: 'all, open, by address' },
          { value: 'predictions', label: '🔮  Predictions',   hint: 'markets, positions, stats' },
          { value: 'wallets',     label: '👛  Wallets',       hint: 'list, get by address' },
          { value: 'leaderboard', label: '🏆  Leaderboard',   hint: 'ranked users and agents' },
          { value: 'exit',        label: '✖   Exit',          hint: '' },
        ])

        if (!section || section === 'exit') break

        try {
          if (section === 'agents')      await menuAgents()
          if (section === 'market')      await menuMarket()
          if (section === 'orders')      await menuOrders()
          if (section === 'predictions') await menuPredictions()
          if (section === 'wallets')     await menuWallets()
          if (section === 'leaderboard') await menuLeaderboard()
        } catch (err: any) {
          p.log.error(err?.message ?? String(err))
        }

        const again = await p.confirm({ message: 'Back to main menu?' })
        if (p.isCancel(again) || !again) break
      }

      p.outro('Bye!')
    },
  }
