---
name: fresh-launches
description: List freshly created DEX pools / newly launched tokens on a chain (price, liquidity, age) via GeckoTerminal. Use when the user asks "what just launched", "new pairs", "fresh tokens", or wants early/sniping alpha on Base or another chain.
capabilities: [external_api]
---

# Fresh Launches

List the newest DEX pools on a chain using the GeckoTerminal public API (free, no key).

## When to use

The user wants newly created tokens / pairs — "what just launched", "fresh pairs", sniping alpha.

## Steps

1. Pick the network (default `base`; ids: `base`, `eth`, `solana`, `bsc`, `arbitrum`).
2. Run the bundled script (Node 20+, no key):
   ```
   node "{{SKILL_DIR}}/fresh.mjs" [network] [count]
   ```
3. Present the list (name, price, liquidity, age).

## Rules

- These are **freshly created pools** — extremely high risk. Always recommend running the `token-safety` skill before buying.
- Only report what the script returns; never invent tokens.
