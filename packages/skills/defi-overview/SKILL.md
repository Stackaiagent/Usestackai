---
name: defi-overview
description: DeFi overview via DeFiLlama — total TVL, a chain's TVL, its top protocols, and the top chains by TVL. Use when the user asks about DeFi TVL, the biggest protocols on Base (or another chain), or the state of DeFi.
capabilities: [external_api]
---

# DeFi Overview

Summarize DeFi activity using the DeFiLlama public API (free, no key). Default chain is Base.

## When to use this skill

The user asks about DeFi TVL, the biggest/top protocols on a chain, or a snapshot of the DeFi market.

## Steps

1. **Pick the chain** (default `Base`). Use the DeFiLlama display name (e.g. `Base`, `Ethereum`, `Arbitrum`, `Solana`). Use the count the user asked for, else 10.
2. **Run the bundled script** (Node 20+, no deps):
   ```
   node "{{SKILL_DIR}}/overview.mjs" [chain] [count]
   ```
3. **Present the result**: total DeFi TVL, the chain's TVL, its top protocols, and the top chains by TVL.
   - If "chain not found", tell the user to check the chain name (DeFiLlama display name).

## Rules

- Data source is the DeFiLlama public API. No key needed.
- **Report only what the script returns — don't invent TVL figures or protocols.**
