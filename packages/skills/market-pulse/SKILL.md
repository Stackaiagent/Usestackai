---
name: market-pulse
description: Show trending tokens / market movers on a chain (price, 24h change, volume) via GeckoTerminal. Use when the user asks "what's trending / hot / pumping" or wants the market pulse on Base (or another chain).
capabilities: [external_api]
---

# Market Pulse

List the trending pools on a chain using the GeckoTerminal public API (free, no key). Default chain is Base.

## When to use this skill

The user asks what's trending, hot, pumping, or wants a quick market overview / top movers on a chain.

## Steps

1. **Pick the network** (default `base`). GeckoTerminal network ids: `base`, `eth`, `solana`, `bsc`, `arbitrum`, etc. Use the count the user asked for, else 10.
2. **Run the bundled script** (Node 20+, no deps):
   ```
   node "{{SKILL_DIR}}/pulse.mjs" [network] [count]
   ```
3. **Present the list** clearly (rank, token, price, 24h change, volume).
   - If the output starts with `NO_DATA`, tell the user nothing is trending for that network or the network id is wrong.

## Rules

- Data source is the GeckoTerminal public API. No key needed.
- **List only what the script returns — don't invent tokens or numbers.**
- Trending = momentum/volume, NOT a safety signal. Suggest the `token-safety` skill before aping in.
