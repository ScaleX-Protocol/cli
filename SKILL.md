---
name: scalex
description: >
  ScaleX CLI — query and interact with the GTX CLOB DEX. Use when you need to
  read market data (prices, candles, depth, trades), inspect orders/balances/positions,
  check agent stats or leaderboard, view lending or prediction markets, or execute
  on-chain transactions (place/cancel orders, deposit/withdraw, predict, borrow/repay).
  Invokes `bun run /Users/renaka/gtx/cli/src/index.ts` or `scalex` if installed globally.
allowed-tools: Bash
---

# ScaleX CLI

You have access to the ScaleX CLI for interacting with the GTX CLOB DEX on Base Sepolia.

**Run commands with:**
```bash
bun run /Users/renaka/gtx/cli/src/index.ts <command> [options]
# or if installed:
scalex <command> [options]
```

Always use `--format json` when you need to parse output programmatically.

---

## Read Commands (no wallet needed)

### Market data
```bash
# All trading pairs
scalex market markets --format json

# Candlestick data
scalex market kline --symbol ETH-USDC --interval 1h --limit 50

# Order book depth
scalex market depth --symbol ETH-USDC --limit 10

# Current price
scalex market ticker-price --symbol ETH-USDC

# 24hr stats for all symbols
scalex market ticker-all --format json

# Recent trades
scalex market trades --symbol ETH-USDC --limit 20
```

### Orders & Account
```bash
# Open orders for a wallet
scalex orders open --address 0x...

# All orders (with history)
scalex orders all --address 0x... --limit 50

# Account balances
scalex orders account --address 0x...
```

### Agents
```bash
scalex agents list --owner 0x...
scalex agents get --agent-token-id 1
scalex agents stats --agent-token-id 1
scalex agents analytics --agent-token-id 1 --window 7d
scalex agents orders --agent-token-id 1 --status open
scalex agents policy --agent-token-id 1
scalex agents users --agent-token-id 1
```

### Leaderboard
```bash
scalex leaderboard get --type agent --sort-by pnl --window 7d --limit 10
scalex leaderboard get --type user --sort-by volume --window 24h
```

### Predictions
```bash
scalex predictions markets --status active --format json
scalex predictions positions --user-address 0x...
scalex predictions pending --address 0x...
scalex predictions stats
```

### Lending
```bash
scalex lending stats
scalex lending dashboard --user 0x...
```

### Activity
```bash
scalex activity get --address 0x... --type trading --period 7d
scalex activity get --address 0x... --type agent
```

### Policies
```bash
scalex policies list --owner 0x...
scalex policies user-analytics --address 0x... --window 30d
```

---

## Write Commands (requires `PRIVATE_KEY` in environment)

**Environment required:**
```
PRIVATE_KEY=0x...
RPC_URL=https://sepolia.base.org
CHAIN_ID=84532
SCALEX_AGENT_TOKEN_ID=<nft-id>   # for agent commands
```

### Agent self-funded trading
```bash
# Place limit order
scalex agent self-limit-order \
  --symbol ETH-USDC \
  --side BUY \
  --price 2000 \
  --quantity 0.1

# Place market order
scalex agent self-market-order \
  --symbol ETH-USDC \
  --side SELL \
  --quantity 0.05

# Cancel order
scalex agent cancel-self-order --symbol ETH-USDC --order-id 42
```

### Delegated trading (on behalf of authorized user)
```bash
scalex agent execute-limit-order \
  --user 0x... \
  --symbol ETH-USDC \
  --side BUY \
  --price 2000 \
  --quantity 0.1

scalex agent execute-market-order \
  --user 0x... \
  --symbol ETH-USDC \
  --side SELL \
  --quantity 0.05

scalex agent cancel-order --user 0x... --symbol ETH-USDC --order-id 42
```

### Deposits & Withdrawals
```bash
scalex balance deposit --token 0x... --amount 100
scalex balance withdraw --token 0x... --amount 50
scalex router deposit --token 0x... --amount 100
```

### Lending
```bash
scalex agent self-borrow --token 0x... --amount 50
scalex agent self-repay --token 0x... --amount 50
scalex router borrow --token 0x... --amount 50
scalex router repay --token 0x... --amount 50
```

### Predictions
```bash
# Via AgentRouter (agent funds)
scalex agent self-predict --market-id 1 --predict-up true --amount 1
scalex agent self-claim --market-id 1

# Direct (user funds, no agent needed)
scalex prediction predict --market-id 1 --predict-up true --amount 1
scalex prediction claim --market-id 1
scalex prediction claim-batch --market-ids 1,2,3
```

### Policy management
```bash
scalex agent authorize --agent-token-id 1 --policy '{"maxOrderSize":"1000","maxDailyVolume":"10000","allowedPools":[],"enabled":true}'
scalex agent revoke --agent-token-id 1
scalex agent list-marketplace --agent-token-id 1
scalex agent delist-marketplace --agent-token-id 1
```

---

## Tips for Agents

- Use `--format json` for machine-readable output
- Use `--filter-output symbol,price` to extract specific fields
- Use `--token-limit 500` to stay within context budgets
- `--symbol ETH-USDC` auto-resolves to pool struct via `/api/markets`
- All amounts are human-readable (e.g. `"0.1"` not wei)
- Write commands return `{ transactionHash, blockNumber, status, gasUsed }`
- `status: "reverted"` means tx landed but failed — check args and balances
- Run `scalex --llms` for a complete token-efficient command manifest

---

## Environment (Base Sepolia defaults)

| Var | Default |
|-----|---------|
| `API_URL` | `https://base-sepolia-api.scalex.money` |
| `CHAIN_ID` | `84532` |
| `RPC_URL` | `https://sepolia.base.org` |
| `SCALEX_ROUTER` | `0xc02dCE91749Db64f349ef3029E6d9b565454688B` |
| `SCALEX_AGENT_ROUTER` | `0x489981A135bD968df5A00FDE514298F9a87f5772` |
| `SCALEX_BALANCE_MANAGER` | `0xfE938b282ac5914A9e6F6AD39bAb73379D4Ad46D` |
| `SCALEX_PREDICTION` | `0x5f3735f44AC391467110010BBdB0B8928f0D8f1c` |
