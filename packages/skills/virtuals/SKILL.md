---
name: virtuals
description: Explore the Virtuals Protocol ecosystem — list the top AI-agent tokens by market cap, or look up a specific Virtuals agent (price change, holders, category, token address). Use when the user asks about Virtuals, virtuals.io agents, "top virtuals", or a specific agent on Virtuals.
capabilities: [external_api]
---

# Virtuals

Read the Virtuals Protocol ecosystem (AI-agent tokens on Base) using the public Virtuals API (free, no key).

## When to use

The user asks about Virtuals Protocol, what's trending on virtuals.io, the top agents, or a specific Virtuals agent.

## Steps

1. Run the bundled script (Node 20+, no key):
   - Top agents: `node "{{SKILL_DIR}}/virtuals.mjs" top [count]`
   - Find an agent: `node "{{SKILL_DIR}}/virtuals.mjs" search <name>`
2. Present the result (name, $symbol, market cap, 24h change, holders, category, and token address for search).
   - If search returns `NO_RESULTS`, tell the user no agent matched that name.

## Rules

- Market caps are denominated in **$VIRTUAL** (Virtuals' base token), not USD.
- Data is the Virtuals Protocol public API — read-only, no key.
- Only report what the script returns; never invent agents or numbers.
