---
title: "fix: Sync CLI commands with API and contract"
type: fix
status: active
date: 2026-03-08
brainstorm: docs/brainstorms/2026-03-08-cli-api-sync-brainstorm.md
---

# fix: Sync CLI commands with API and contract

## Overview

Research surfaced drift between `gtx/cli` and two upstream sources: the REST API (`gtx/clob-indexer/api`) and the on-chain contracts (`gtx/clob-dex`). This plan fixes all CLI-side issues — organized by severity across four phases.

**Source of truth:** The API and contract are authoritative. The CLI conforms to them.

---

## Problem Statement

### REST API drift (10 mismatches)

1. `predictions markets --status` sends strings; API does `parseInt()` → `NaN` → filter silently ignored
2. `trades initial` / `trades orders` treats `address` as optional; API requires it → 400/422
3. `agents orders --status` is missing `partially_filled` from the enum
4. `wallets list` sends `limit`/`offset`; API only accepts `indices` range string
5. Two API endpoints (`/api/agent-orders`, `/api/pending-orders`) have no CLI surface

### Contract drift (2 mismatches)

6. **CRITICAL** — `agent authorize` ABI encodes a 4-field Policy tuple; `PolicyFactoryStorage.Policy` has ~45 fields. Every `agent authorize` call writes garbage policy data on-chain.
7. **HIGH** — CRE queue functions (`queueMarketOrder`, `queueLimitOrder`, `cancelPendingOrder`, `getPendingOrder`) were added to AgentRouter in commit `ecc7437` but have no ABI entries or CLI commands.

---

## Implementation Plan

### Phase 1 — P0: Fix silent failures and hard errors

#### 1.1 — `predictions.ts`: Map status strings to integers

**File:** `src/commands/predictions.ts`

**Change:** Add a status map constant and apply it before the API call.

```ts
// src/commands/predictions.ts

const PREDICTION_STATUS_MAP = {
  active: 0,
  resolved: 2,   // API stores as "settled" (status 2)
  cancelled: 3,
} as const;

// In the command definition, before fetching:
const statusInt = options.status !== undefined
  ? PREDICTION_STATUS_MAP[options.status]
  : undefined;

// Pass statusInt (not options.status) to fetchAPI
```

**Acceptance criteria:**
- [ ] `predictions markets --status active` sends `?status=0`
- [ ] `predictions markets --status resolved` sends `?status=2`
- [ ] `predictions markets --status cancelled` sends `?status=3`
- [ ] Omitting `--status` sends no status param (returns all)
- [ ] Constant is defined at module level, not inline in the run function

**Note:** Status value `1` is unconfirmed in the API codebase. Do not expose it in the enum.

---

#### 1.2 — `trades.ts`: Make address required + add format validation

**File:** `src/commands/trades.ts`

Both `trades initial` and `trades orders` sub-commands are affected (they share the same address query param validation on the API side).

**Change:** Replace `z.string().optional()` with a required regex-validated field.

```ts
// Before
address: z.string().optional()

// After
address: z.string().regex(
  /^0x[a-fA-F0-9]{40}$/,
  "must be a valid Ethereum address (0x followed by 40 hex characters)"
)
```

**Acceptance criteria:**
- [ ] Both `trades initial` and `trades orders` require `--address`
- [ ] Passing a malformed address (e.g. `--address foo`) fails at CLI with a clear message before any network call
- [ ] Valid `0x...` address proceeds to API call

---

#### 1.3 — `agents.ts`: Add `partially_filled` to orders status enum

**File:** `src/commands/agents.ts`

**Change:** Extend the `status` enum for `agents orders`.

```ts
// Before
status: z.enum(['open', 'filled', 'cancelled'])

// After
status: z.enum(['open', 'filled', 'partially_filled', 'cancelled'])
```

The API handler uses `UPPER(status) = UPPER($n)` so lowercase values match correctly.

**Acceptance criteria:**
- [ ] `agents orders --status partially_filled` sends `?status=partially_filled` and returns results
- [ ] All previous status values still work

---

### Phase 2 — P1: Fix wallets list pagination

#### 2.1 — `wallets.ts`: Replace `limit`/`offset` with `indices`

**File:** `src/commands/wallets.ts`

The API's `/wallets` endpoint accepts only `?indices=<range-string>` matching `^[0-9,\-]+$`. Examples: `"0-19"`, `"0,2,5"`, `"0-4,10"`.

**Change:** Replace the limit/offset input with an optional `indices` string.

```ts
// Before
limit:  z.number().optional().default(20),
offset: z.number().optional().default(0),

// After
indices: z.string()
  .regex(/^[0-9,\-]+$/, "must be a range string like '0-19' or '0,2,5'")
  .optional()
  .describe("Wallet index range (e.g. '0-19' for first 20, '0,2,5' for specific indices)")
```

**Acceptance criteria:**
- [ ] `wallets list --indices "0-19"` sends `?indices=0-19`
- [ ] `wallets list --indices "0,2,5"` sends `?indices=0,2,5`
- [ ] `wallets list` (no flag) sends no `indices` param and returns whatever the API default is
- [ ] `wallets list --limit 20` is no longer a valid flag (Zod rejects it)
- [ ] Malformed indices (e.g. `--indices "abc"`) fail at CLI with a clear error

---

### Phase 3 — P0 (contract): Fix AgentRouter ABI drift

#### 3.0 — `abis.ts`: Expand Policy tuple in `AgentRouterMarketplaceABI`

**File:** `src/lib/abis.ts`

**Problem:** The current ABI encodes Policy as a 4-field tuple:
```
{ maxOrderSize, maxDailyVolume, allowedPools[], enabled }
```
The actual `PolicyFactoryStorage.Policy` struct (defined in `clob-dex/src/ai-agents/storages/PolicyFactoryStorage.sol:17–105`) has ~45 fields. ABI encoding a 4-field tuple against a 45-field struct produces corrupted calldata. The transaction may not revert (all extra fields default to zero) but the policy will be silently misconfigured on-chain.

**Change:** Replace the Policy tuple components in `AgentRouterMarketplaceABI` with the full struct field list in the exact order from `PolicyFactoryStorage.sol`. Key fields include (in order):

```
enabled, installedAt, expiryTimestamp,
maxOrderSize, minOrderSize,
whitelistedTokens[], blacklistedTokens[],
allowMarketOrders, allowLimitOrders, allowSwap,
allowBorrow, allowRepay, allowSupplyCollateral, allowWithdrawCollateral,
allowPlaceLimitOrder, allowCancelOrder,
allowPredict, allowClaimPrediction, maxPredictionStake,
allowBuy, allowSell,
allowAutoBorrow, maxAutoBorrowAmount,
allowAutoRepay, minDebtToRepay, minHealthFactor,
maxSlippageBps, minTimeBetweenTrades, emergencyRecipient,
dailyVolumeLimit, weeklyVolumeLimit,
maxDailyDrawdown, maxWeeklyDrawdown,
maxTradeVsTVLBps, minWinRateBps, minSharpeRatio,
maxPositionConcentrationBps, maxCorrelationBps,
maxTradesPerDay, maxTradesPerHour,
tradingStartHour, tradingEndHour,
minReputationScore, useReputationMultiplier,
requiresChainlinkFunctions
```

> ⚠️ **IMPORTANT:** Cross-reference the exact field order from `PolicyFactoryStorage.sol` lines 17–105 when implementing. ABI order must match the struct declaration order exactly.

The `agent authorize` write command in `src/commands/write/agent.ts` may also need updating if it constructs the Policy object — verify the field names match the expanded ABI.

**Acceptance criteria:**
- [ ] `AgentRouterMarketplaceABI` Policy tuple has all ~45 fields in the exact order matching `PolicyFactoryStorage.sol`
- [ ] `agent authorize` command builds a Policy object with all fields (safe defaults for unspecified fields)
- [ ] A dry-run `agent authorize` encodes calldata that matches what `cast calldata` produces from the Solidity ABI
- [ ] Existing `agent authorize` tests (if any) pass with the new ABI

---

#### 3.1 — `abis.ts`: Add CRE queue functions to `AgentRouterABI`

**File:** `src/lib/abis.ts`

**Problem:** `queueMarketOrder`, `queueLimitOrder`, `cancelPendingOrder`, `getPendingOrder` were added to `AgentRouter.sol` in commit `ecc7437`. They are absent from the CLI's ABI. Agents using `requiresChainlinkFunctions = true` policies cannot queue or cancel orders from the CLI.

**Change:** Add the following entries to the AgentRouter ABI:

```ts
// queueMarketOrder — same params as executeMarketOrder, returns uint256 pendingOrderId
{
  name: 'queueMarketOrder',
  type: 'function',
  inputs: [
    { name: 'user', type: 'address' },
    { name: 'strategyAgentId', type: 'uint256' },
    { name: 'pool', type: 'tuple', components: [/* Pool struct */] },
    { name: 'side', type: 'uint8' },
    { name: 'quantity', type: 'uint128' },
    { name: 'minOutAmount', type: 'uint128' },
    { name: 'autoRepay', type: 'bool' },
    { name: 'autoBorrow', type: 'bool' },
  ],
  outputs: [{ name: 'pendingOrderId', type: 'uint256' }],
  stateMutability: 'nonpayable',
},
// queueLimitOrder, cancelPendingOrder, getPendingOrder — follow same pattern
```

Then add CLI commands `agent queue-market-order`, `agent queue-limit-order`, `agent cancel-pending-order`, `agent get-pending-order` in `src/commands/write/agent.ts`.

**Acceptance criteria:**
- [ ] All four CRE functions present in the ABI
- [ ] `agent queue-market-order` and `agent queue-limit-order` accept same params as their `execute-*` counterparts, returning a `pendingOrderId`
- [ ] `agent cancel-pending-order --pendingOrderId <id>` cancels a queued order
- [ ] `agent get-pending-order --pendingOrderId <id>` reads pending order state (read-only)

---

### Phase 4 — P2: Add missing CLI commands

#### 4.1 — `agents.ts`: Add `all-orders` sub-command

**File:** `src/commands/agents.ts`

**Endpoint:** `GET /api/agent-orders` (defined in `policies.routes.ts`)

**Query params:** `chainId`, `owner`, `executor`, `status`, `limit`, `offset`

**Note on field names:** The `agent-orders` route handler in `policies.routes.ts` returns raw snake_case DB fields (`order_id`, `quote_quantity`, `executed_quote_quantity`). Display logic must use snake_case keys, not camelCase.

**Status enum** for this command: `z.enum(['open', 'filled', 'partially_filled', 'cancelled', 'rejected'])` — matches all known DB values the API normalizes with `UPPER()`.

```ts
// New sub-command: agents all-orders
{
  name: 'all-orders',
  description: 'List all agent-placed orders across all agents',
  options: {
    chainId: z.number().optional().default(84532).describe('Chain ID (default: 84532 Base Sepolia)'),
    owner:    z.string().optional().describe('Filter by agent owner address'),
    executor: z.string().optional().describe('Filter by executor address'),
    status:   z.enum(['open', 'filled', 'partially_filled', 'cancelled', 'rejected']).optional(),
    limit:    z.number().optional().default(20),
    offset:   z.number().optional().default(0),
  },
  run: async (options) => {
    const data = await fetchAPI('/api/agent-orders', options);
    // display tabular output, use snake_case field names from response
  }
}
```

**Acceptance criteria:**
- [ ] `agents all-orders` returns data from `/api/agent-orders`
- [ ] `--owner`, `--executor`, `--status`, `--limit`, `--offset` all work as filters
- [ ] `--chainId` defaults to `84532`
- [ ] Response fields displayed correctly (snake_case from API)

---

#### 4.2 — `agents.ts`: Add `pending-orders` sub-command (BLOCKED)

**File:** `src/commands/agents.ts`

**Endpoint:** `GET /api/pending-orders` (defined in `agents.routes.ts:138`)

> ⚠️ **BLOCKER:** `AgentsService.getPendingOrders` is referenced in the route but does **not exist** in `agents.service.ts`. The API endpoint will throw a runtime error when called. **Do not ship this CLI command until the service method is implemented on the API side.**

**Pre-condition:** API team must implement `AgentsService.getPendingOrders` in `clob-indexer/api/src/services/agents.service.ts`.

Once unblocked, add:

```ts
// New sub-command: agents pending-orders
{
  name: 'pending-orders',
  description: 'List pending CRE agent orders awaiting validation (oldest first)',
  options: {
    chainId: z.number().optional().default(84532),
    limit:   z.number().optional().default(20),
    offset:  z.number().optional().default(0),
  },
  run: async (options) => {
    const data = await fetchAPI('/api/pending-orders', options);
    // display tabular output
  }
}
```

**Acceptance criteria (when unblocked):**
- [ ] `agents pending-orders` calls `/api/pending-orders`
- [ ] Results are sorted oldest-first (API behavior, not CLI concern)
- [ ] `--limit` and `--offset` work for pagination

---

## System-Wide Impact

- **Interaction graph:** API fixes are in `src/commands/*.ts` (leaf nodes). Contract ABI fix touches `src/lib/abis.ts` which is imported by all write commands — review all write commands after the ABI change.
- **Error propagation:** Phase 1 changes move validation from server (422) to CLI (Zod fail). Users get better error messages without a round-trip.
- **State lifecycle risks:** API fixes are read-only GETs. The `authorize` ABI fix affects a write command that creates on-chain state — test carefully on a local anvil fork before deploying.
- **API surface parity:** After these fixes, the CLI reflects what the API accepts and exposes.
- **Contract surface parity:** After Phase 3, the CLI ABI matches the deployed AgentRouter for all supported operations.
- **Breaking changes:** `wallets list` changes user-facing flags (`--limit`/`--offset` → `--indices`). Acceptable — old flags were non-functional anyway. The `agent authorize` command will behave differently (correctly) after the ABI fix.

---

## Acceptance Criteria

### Functional — REST API sync

- [ ] `predictions markets --status active/resolved/cancelled` correctly filters (not all-results)
- [ ] `trades initial --address` and `trades orders --address` are required; malformed addresses fail at CLI
- [ ] `agents orders --status partially_filled` returns partially filled orders
- [ ] `wallets list --indices "0-19"` works; `--limit` / `--offset` flags removed
- [ ] `agents all-orders` command exists and works with all filters
- [ ] `agents pending-orders` is deferred until API-side blocker is resolved

### Functional — Contract sync

- [ ] `agent authorize` ABI Policy tuple matches all ~45 fields in `PolicyFactoryStorage.sol` in exact order
- [ ] `agent authorize` encodes correct calldata (verify with `cast calldata` or a fork test)
- [ ] `agent queue-market-order` and `agent queue-limit-order` commands exist and return a `pendingOrderId`
- [ ] `agent cancel-pending-order` and `agent get-pending-order` commands exist

### Quality

- [ ] No new `any` or `unknown` casts introduced
- [ ] All Zod schemas match the API validation schemas exactly
- [ ] ABI field order cross-referenced against `PolicyFactoryStorage.sol` during implementation (comment in code)
- [ ] CLI help text for `wallets list --indices` explains the range syntax

---

## Dependencies & Risks

| Risk | Mitigation |
|---|---|
| `AgentsService.getPendingOrders` missing in API | Defer `agents pending-orders` CLI command; track as API-side task |
| `wallets list` breaking change (flag names change) | Acceptable — old flags were non-functional, so no real breakage |
| Prediction status `1` unknown | Do not expose it; add a TODO comment in the status map constant |
| `agent-orders` response uses snake_case | Verified from `policies.routes.ts`; handle in display code |
| `agent authorize` ABI fix is on-chain write | Test on anvil fork first; verify calldata with `cast calldata` before using on testnet |
| Policy struct may change again | Add a comment in `abis.ts` pointing to `PolicyFactoryStorage.sol` so future drift is obvious |
| CRE queue commands need policy flag `requiresChainlinkFunctions = true` | Document in command help text; these only work for CRE-enabled agents |

---

## References

### Internal

- `src/commands/predictions.ts` — status filter (fix in 1.1)
- `src/commands/trades.ts` — address validation (fix in 1.2)
- `src/commands/agents.ts` — status enum (fix in 1.3), read commands (fixes in 4.1, 4.2)
- `src/commands/wallets.ts` — indices param (fix in 2.1)
- `src/lib/abis.ts` — Policy tuple ABI (fix in 3.0), CRE queue functions (fix in 3.1)
- `src/commands/write/agent.ts` — `agent authorize` write command, CRE queue commands (fix in 3.0, 3.1)
- `src/lib/api.ts` — fetchAPI wrapper (no changes needed)
- `src/lib/contracts.ts` — all Base Sepolia addresses verified correct (no changes needed)

### Upstream sources

- `clob-dex/src/ai-agents/storages/PolicyFactoryStorage.sol:17–105` — authoritative Policy struct (Phase 3.0)
- `clob-dex/src/ai-agents/AgentRouter.sol` — CRE queue functions (Phase 3.1)
- `clob-indexer/api/src/routes/predictions.routes.ts:21` — parseInt(status)
- `clob-indexer/api/src/routes/agents.routes.ts:138` — pending-orders route (broken server-side)
- `clob-indexer/api/src/routes/policies.routes.ts:310` — agent-orders route
- `clob-indexer/api/src/validations/wallet.validation.ts` — indices schema
- `clob-indexer/api/src/validations/trade.validation.ts` — address required

### Brainstorm

- `docs/brainstorms/2026-03-08-cli-api-sync-brainstorm.md`
