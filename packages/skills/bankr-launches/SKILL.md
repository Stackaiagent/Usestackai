---
name: bankr-launches
description: Read Bankr token-launch ecosystem info — list recent token launches, and check creator fees (claimable/claimed/lifetime) for a Bankr-launched token. Public data, no key. Use when the user asks "recent launches on bankr", "what just launched", or "how much fees has 0x… earned".
capabilities: [external_api]
---

# Bankr Launches

Read-only info about tokens launched via Bankr, using Bankr's public API (no API key needed).

## When to use this skill

The user asks about recent Bankr launches, what just launched, or the fees a Bankr-launched token has earned.

## Steps

1. **Run the bundled script** (Node 20+, no key):
   - Recent launches: `node "{{SKILL_DIR}}/launches.mjs" list [count]`  (count optional, default 10)
   - Fees for a token: `node "{{SKILL_DIR}}/launches.mjs" fees <0x-token-address>`
2. **Present the result** clearly (for launches: name/symbol, chain, address, status, how long ago).
   - If `fees` returns `NOT_BANKR`, tell the user that token wasn't launched via Bankr.

## Rules

- Data is Bankr's public API — read-only, no key, no funds touched.
- Only report what the script returns — don't invent launches, fees, or addresses.
