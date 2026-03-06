# ScaleX CLI

Agent-native CLI for the ScaleX DEX, built with [incur](https://github.com/wevm/incur).

Query market data, manage orders, and execute on-chain transactions — from terminal or directly from AI agents with 3x fewer tokens than MCP alternatives.

## Install

```bash
bun install
bun run src/index.ts --help
```

Or build a binary:

```bash
bun run build
./dist/index.js --help
```

## Setup

Copy `.env.example` to `.env` and fill in your values:

```bash
cp .env.example .env
```

Minimum for read commands:
```bash
API_URL=https://base-sepolia-api.scalex.money
```

Minimum for write commands:
```bash
PRIVATE_KEY=0x...
RPC_URL=https://sepolia.base.org
CHAIN_ID=84532
SCALEX_AGENT_TOKEN_ID=<your-nft-id>   # for agent write commands
```

## Usage

### Read Commands

```bash
# Market data
scalex market markets
scalex market kline --symbol ETH-USDC --interval 1h --limit 50
scalex market depth --symbol ETH-USDC
scalex market ticker-all

# Orders
scalex orders open --address 0x...
scalex orders account --address 0x...

# Agents
scalex agents list
scalex agents get --agent-token-id 1
scalex agents stats --agent-token-id 1
scalex agents analytics --agent-token-id 1 --window 7d

# Leaderboard
scalex leaderboard get --type agent --sort-by pnl --window 7d

# Predictions
scalex predictions markets --status active
scalex predictions positions --user-address 0x...

# Lending
scalex lending stats
scalex lending dashboard --user 0x...

# Activity
scalex activity get --address 0x... --type trading

# Policies
scalex policies list --owner 0x...
scalex policies user-analytics --address 0x... --window 30d
```

### Write Commands (requires `PRIVATE_KEY`)

```bash
# Place a limit order (agent self-funded)
scalex agent self-limit-order \
  --symbol ETH-USDC \
  --side BUY \
  --price 2000 \
  --quantity 0.1

# Place a market order
scalex agent self-market-order --symbol ETH-USDC --side SELL --quantity 0.05

# Cancel an order
scalex agent cancel-self-order --symbol ETH-USDC --order-id 42

# Deposit tokens to DEX
scalex balance deposit --token 0x... --amount 100

# Borrow from lending pool (agent)
scalex agent self-borrow --token 0x... --amount 50

# Make a prediction
scalex agent self-predict --market-id 1 --predict-up true --amount 1

# Direct prediction (no agent)
scalex prediction predict --market-id 1 --predict-up true --amount 1
scalex prediction claim --market-id 1
scalex prediction claim-batch --market-ids 1,2,3
```

### Output Formats

```bash
# JSON output (for piping/parsing)
scalex market markets --format json

# YAML output
scalex market ticker-all --format yaml

# Filter output keys
scalex market markets --filter-output symbol,baseCurrency

# Token-limited output (for LLM context windows)
scalex market markets --token-limit 500
```

### Agent Integration (MCP)

Register the CLI as an MCP server so AI agents can discover and call it automatically:

```bash
scalex mcp add
```

Or sync skills to your agent:

```bash
scalex skills add
```

### LLM Manifest

Print a token-efficient manifest of all commands for including in system prompts:

```bash
scalex --llms
```

## Command Groups

| Group | Commands | Description |
|-------|----------|-------------|
| `market` | kline, depth, trades, ticker-24hr, ticker-all, ticker-price, pairs, markets | Market data |
| `orders` | all, open, account | Order management |
| `agents` | list, get, stats, lending, policy, users, orders, violations, circuit-breakers, predictions, analytics | Agent registry |
| `leaderboard` | get | Rankings |
| `predictions` | markets, stats, events, positions, market-positions, pending | Prediction markets (read) |
| `lending` | stats, dashboard | Lending protocol (read) |
| `activity` | get | Unified activity history |
| `policies` | list, user-analytics | Agent policies |
| `currencies` | list, get | Token registry |
| `trades` | initial, orders, price, ticker | Legacy trade routes |
| `wallets` | list, get | Wallet registry |
| `faucet` | address, request, native-request, history | Testnet faucet |
| `agent` | self-limit-order, self-market-order, cancel-self-order, execute-limit-order, execute-market-order, cancel-order, authorize, revoke, list-marketplace, delist-marketplace, self-predict, self-claim, execute-predict, execute-claim, self-borrow, self-repay, execute-borrow, execute-repay, execute-supply, execute-withdraw | AgentRouter writes |
| `balance` | deposit, withdraw | BalanceManager writes |
| `router` | cancel-order, borrow, repay, deposit | ScaleXRouter writes |
| `prediction` | predict, claim, claim-batch | PricePrediction direct writes |

## Symbol Resolution

For write commands that require a pool (`--symbol`):

- `--symbol ETH-USDC` — auto-resolves via `/api/markets` → on-chain `PoolManager.getPool()`
- `--base-currency 0x... --quote-currency 0x... --order-book 0x...` — use raw addresses directly

## Contract Addresses

Built-in defaults for Base Sepolia (chain 84532). Override with env vars:

```bash
SCALEX_ROUTER=0xc02dCE91749Db64f349ef3029E6d9b565454688B
SCALEX_BALANCE_MANAGER=0xfE938b282ac5914A9e6F6AD39bAb73379D4Ad46D
SCALEX_POOL_MANAGER=0x5F1E83f33fD58ab4c142b35BeBEC8cA941912b59
SCALEX_AGENT_ROUTER=0x489981A135bD968df5A00FDE514298F9a87f5772
SCALEX_PREDICTION=0x5f3735f44AC391467110010BBdB0B8928f0D8f1c
```
