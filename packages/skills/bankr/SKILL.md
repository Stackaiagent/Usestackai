---
name: bankr
description: Trade crypto, check portfolio/balances, get prices, transfer, or launch a token via Bankr using the user's own Bankr wallet (Bankr handles custody + signing). Use when the user wants to trade/swap, see their balance/portfolio, send crypto, or deploy/launch a token with their Bankr account.
capabilities: [external_api, onchain_writes]
---

# Bankr

Run real crypto actions through the user's **own Bankr wallet** — Bankr custodies the wallet and signs server-side. Needs the user's Bankr API key (`bk_…`), read from the `BANKR_API_KEY` environment variable (set via `stackai bankr set <bk_…>`).

## When to use

The user wants to: check balance/portfolio, get a token price, swap/trade, transfer crypto, or launch/deploy a token — with their Bankr account.

## Steps

1. **Make sure the key is set.** If the script prints `NO_KEY`, tell the user to run `stackai bankr set <bk_...>` (get a key at bankr.bot/api-keys) and stop here.
2. **Run the bundled script** (Node 20+; it reads the key from the environment — *never type the key yourself*):
   - Balances / portfolio: `node "{{SKILL_DIR}}/bankr.mjs" portfolio [chains]`  (chains optional, e.g. `base,solana`)
   - Wallet info: `node "{{SKILL_DIR}}/bankr.mjs" me`
   - Anything else — trade, swap, transfer, launch a token, prices, questions: `node "{{SKILL_DIR}}/bankr.mjs" prompt "<the user's request in plain words>"`
3. **Present the result** clearly.

## Rules

- The script reads `BANKR_API_KEY` from the environment. **Never put the key in a command or in your output.**
- Bankr executes **real transactions with real funds**. For anything that spends or moves money (swap, transfer, launch), restate exactly what will happen and proceed only after the user confirms.
- If you get a 403, the key is read-only — tell the user to re-issue it with `--read-write` at bankr.bot.
- Never invent amounts, token addresses, or results — only report what the script returns.
