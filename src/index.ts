#!/usr/bin/env bun
/**
 * ScaleX CLI — agent interface for ScaleX
 *
 * Usage:
 *   scalex market markets
 *   scalex agent self-limit-order --symbol ETH-USDC --side BUY --price 2000 --quantity 0.1
 *   scalex --help
 */

// Load global config from ~/.config/scalex/.env, then fall back to CWD .env
import { existsSync } from 'fs'
import { join } from 'path'

const globalEnv = join(process.env.HOME ?? '~', '.config', 'scalex', '.env')
if (existsSync(globalEnv)) {
  const { config } = await import('dotenv')
  config({ path: globalEnv, override: false, quiet: true })
}

import { Cli } from 'incur'

// Read commands
import { market }      from './commands/market.js'
import { orders }      from './commands/orders.js'
import { agents }      from './commands/agents.js'
import { leaderboard } from './commands/leaderboard.js'
import { predictions } from './commands/predictions.js'
import { lending }     from './commands/lending.js'
import { activity }    from './commands/activity.js'
import { policies }    from './commands/policies.js'
import { currencies }  from './commands/currencies.js'
import { trades }      from './commands/trades.js'
import { wallets }     from './commands/wallets.js'
import { faucet }      from './commands/faucet.js'
import { menuCommand } from './commands/menu.js'

// Write commands
import { agent }      from './commands/write/agent.js'
import { balance }    from './commands/write/balance.js'
import { router }     from './commands/write/router.js'
import { prediction } from './commands/write/prediction.js'

Cli.create('scalex', {
  description: 'ScaleX CLI — agent-native interface to ScaleX. Query markets, manage orders, trade, lend, and execute on-chain transactions.',
  version: '1.0.0',
})
  // ── Read (API) ─────────────────────────────────────────────────────────────
  .command(market)
  .command(orders)
  .command(agents)
  .command(leaderboard)
  .command(predictions)
  .command(lending)
  .command(activity)
  .command(policies)
  .command(currencies)
  .command(trades)
  .command(wallets)
  .command(faucet)
  .command('menu', menuCommand)
  // ── Write (on-chain) ───────────────────────────────────────────────────────
  .command(agent)
  .command(balance)
  .command(router)
  .command(prediction)
  .serve()
