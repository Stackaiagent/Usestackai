---
icon: coins
description: Trade, transfer, and launch tokens through your own Bankr wallet — keys stay with you.
---

# Bankr

[Bankr](https://bankr.bot) is a crypto trading agent and wallet API. StackAI connects to it so you can trade, check your portfolio, transfer, or launch a token in plain language — using **your own Bankr wallet**.

## How custody works (and why it's safe)

Bankr **manages the wallet and signs transactions server-side**. StackAI never holds your private keys — it only passes your Bankr API key to Bankr's API. That key is read from an environment variable, so the model never sees it in its context.

This gives a clean trust line:

* **Trading and launches run on the CLI**, where your Bankr key lives on your machine (in `~/.stackai/config.json`). It never reaches StackAI's servers.
* **Telegram is read-only.** The `bankr` skill (which can move funds) is not loaded there. On Telegram you can still read Bankr ecosystem data via [`bankr-launches`](skills.md).

> We never ask for a key that can move your funds on a surface we host. Your trading key stays on your machine.

## Setup (CLI)

```bash
# 1. Get a key at bankr.bot/api-keys
#    - read-only: portfolio, prices, balances (can't trade)
#    - read-write (--read-write): trade, transfer, launch
stackai bankr set <bk_...>
stackai bankr            # check status
stackai bankr clear      # remove it
```

## Using it

Just ask in an interactive session:

```
› what's my portfolio?
› swap 0.1 ETH to USDC on base
› launch a token called PEPE on base
```

For anything that **spends or moves funds**, the agent restates what will happen and waits for your approval (the `run_command` prompt) before Bankr executes it.

{% hint style="info" %}
A **read-only** Bankr key can't trade — the write endpoints return 403. Use a read-only key if you only want balances and prices; use `--read-write` (set at bankr.bot) to enable trading and launches.
{% endhint %}

## What Bankr can do

Trade and swap (Base, Ethereum, Polygon, Solana, and more), check portfolio with PnL and NFTs, transfer tokens, launch tokens, set up automated trading (DCA, limit, stop-loss), leverage, and Polymarket bets — all through one API key tied to your Bankr wallet.

## Read-only ecosystem data (no key)

The [`bankr-launches`](skills.md) skill reads Bankr's public API — recent token launches and creator fees — with **no key at all**. It works on both the CLI and Telegram.

```
› recent launches on bankr
› how much fees has 0x… earned
```
