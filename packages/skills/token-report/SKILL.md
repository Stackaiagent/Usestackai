---
name: token-report
description: Report a crypto token's price, market cap, liquidity, and 24h volume from its contract address (Base and other chains, via Dexscreener). Use when the user gives a 0x token address or asks for a token's price / mcap / liquidity.
capabilities: [external_api]
---

# Token Report

Generate a market snapshot for a token from its on-chain contract address using the Dexscreener public API (free, no API key).

## When to use this skill

The user gives a token contract address (`0x` + 40 hex chars) or asks for a token's price, market cap, liquidity, or volume.

## Steps

1. **Get the token address.** It must match `0x` followed by 40 hex characters. If the user gave a name or symbol instead of an address, ask them for the contract address — this skill looks up by address, not by name.

2. **Run the bundled report script** (Node 20+, no extra dependencies):
   ```
   node "{{SKILL_DIR}}/report.mjs" <TOKEN_ADDRESS>
   ```
   Replace `<TOKEN_ADDRESS>` with the user's actual `0x...` address.

3. **Present the result** as a clean, readable report (token name/symbol, chain, price, market cap, liquidity, 24h volume, 24h change, chart link).
   - If the output starts with `NO_PAIRS`, tell the user no DEX pairs were found — the token is likely unlisted or has no liquidity.
   - If the script errors, relay the error briefly and suggest they double-check the address.

## Rules

- Data source is the Dexscreener public API. No key or secret is needed.
- The script auto-selects the most-liquid trading pair across chains.
- **Only report numbers the script returns — never fabricate or estimate values.**
