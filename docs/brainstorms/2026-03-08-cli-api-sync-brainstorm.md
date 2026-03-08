---
date: 2026-03-08
topic: cli-api-sync
---

# CLI ↔ API Sync

## What We're Building

The CLI (`gtx/cli`) has drifted from the API (`gtx/clob-indexer/api`). Ten concrete mismatches were found through research — some cause silent failures (wrong data returned), some cause hard errors (400s), and some leave useful API endpoints completely inaccessible from the CLI.

The fix lives entirely on the CLI side: update CLI commands to match what the API currently expects. No API changes required.

## Why This Approach

Fixing the CLI side is the fastest, lowest-risk path — no API deploy, no coordination needed. The API is the source of truth. Where the API has strong validation (e.g. required address, integer status), the CLI should conform to it.

## Issues to Fix (Prioritized)

### P0 — Critical bugs (silent failures / hard errors)

| Issue | Current CLI | API Expects | Impact |
|---|---|---|---|
| `predictions status` filter | Sends `'active'`, `'resolved'`, `'cancelled'` (strings) | Integer `0`, `2`, `3` | Filter silently does nothing — `parseInt('active')` = NaN |
| `trades` address field | `z.string().optional()` | Required, validated `^0x[a-fA-F0-9]{40}$` | Calling without address returns 400 |
| `agents orders` missing `'partially_filled'` | Enum omits it | DB stores `PARTIALLY_FILLED` | Cannot filter for partially filled orders |

**Fix for predictions status**: Add a constant map `{ active: 0, resolved: 2, cancelled: 3 }` and convert before sending.

### P1 — Wallets pagination broken

| Issue | Current CLI | API Expects |
|---|---|---|
| `wallets list` | Sends `?limit=20&offset=0` | Accepts only `?indices=<range-string>` e.g. `0-19,25` |

**Fix**: Replace `limit`/`offset` inputs with an `indices` string input (or derive a range from limit/offset and convert to `"0-19"` format).

### P2 — Missing CLI commands

API endpoints with no CLI surface:
- `GET /api/pending-orders?chainId&limit&offset` — pending CRE agent orders
- `GET /api/agent-orders?chainId&owner&executor&status&limit&offset` — cross-agent order view

Add two new commands: `agents pending-orders` and `agents all-orders`.

## Key Decisions

- **Fix CLI, not API**: API is source of truth; no API deploy needed.
- **Status as user-friendly enum in CLI**: Keep `active`/`resolved`/`cancelled` as user input, map to integers before the API call internally. Document the mapping with a constant.
- **Wallets indices**: Expose `--indices` flag matching API semantics; deprecate/remove `--limit`/`--offset` for wallets list.
- **Address required for trades**: Remove `.optional()` from the trades address field — make it required at CLI level to match API validation.

## Open Questions

- None — all decisions resolved.

## Next Steps

→ `/workflows:plan` for implementation details
