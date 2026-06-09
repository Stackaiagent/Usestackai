---
name: token-search
description: Find a token's contract address by name or symbol (across chains) via Dexscreener. Use when the user names a token but doesn't have its 0x address, e.g. "find PEPE", "what's the contract for BRETT", before a token-report or token-safety check.
capabilities: [external_api]
---

# Token Search

Look up a token's contract address by name or symbol using Dexscreener (free, no key). Pairs nicely with `token-report` and `token-safety`, which need an address.

## When to use

The user mentions a token by name/symbol but doesn't have its `0x` address.

## Steps

1. Run the bundled script (Node 20+, no key):
   ```
   node "{{SKILL_DIR}}/search.mjs" <name or symbol>
   ```
2. Present the matches (name, symbol, chain, address, price, liquidity), most-liquid first.
3. If the user then wants details, use the address with `token-report` or `token-safety`.

## Rules

- Many tokens share a symbol — show the most-liquid matches and let the user confirm the right one by chain/liquidity.
- Only report what the script returns; never invent addresses.
