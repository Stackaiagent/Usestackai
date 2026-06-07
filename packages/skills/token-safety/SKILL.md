---
name: token-safety
description: Rug / safety check for a crypto token — honeypot status, buy/sell tax, ownership risks, holder concentration, and LP lock (via GoPlus, default Base). Use when the user asks "is this token safe / a scam / a rug / a honeypot" or wants a risk check on a 0x address.
capabilities: [external_api]
---

# Token Safety Check

Run a rug / safety check on a token using the GoPlus Security API (free, no key). Default chain is Base (8453).

## When to use this skill

The user asks whether a token is safe, a scam, a rug, or a honeypot — or wants a risk check on a `0x` token address.

## Steps

1. **Get the token address** (`0x` + 40 hex). If they mean a non-Base chain, note the chainId (e.g. Ethereum = 1, BSC = 56, Base = 8453). Default to Base.
2. **Run the bundled script** (Node 20+, no deps):
   ```
   node "{{SKILL_DIR}}/check.mjs" <TOKEN_ADDRESS> [chainId]
   ```
3. **Present the result** clearly: honeypot status, taxes, ownership risks, holder concentration, LP lock, and the flag summary.
   - If the output starts with `NO_DATA`, tell the user GoPlus has no data for that token/chain (often very new tokens).
   - Lead with the biggest risk (honeypot or high tax) if present.

## Rules

- Data source is the GoPlus Security public API. No key needed.
- **Report only what the script returns — never invent risk verdicts.**
- Always include that this is informational, not financial advice (DYOR).
