---
icon: robot
description: Use StackAI from Telegram — crypto skills (token reports, rug checks, market pulse) by chat.
---

# Telegram

StackAI is on Telegram. Link your account once, then ask about any token, market, or wallet — right from chat. Perfect for quick crypto checks on the go, no terminal needed.

> Bot: [@YOUR_BOT](https://t.me/YOUR_BOT) <!-- replace with your bot's handle -->

{% hint style="info" %}
Telegram runs the **skill** side of StackAI (crypto queries) — not the full coding agent. Reading and editing code lives in the [CLI](getting-started.md) and [web](vibe.md).
{% endhint %}

## Connect your account (one time)

{% stepper %}
{% step %}
### Start the bot
Open the StackAI bot in Telegram and send `/start`.
{% endstep %}

{% step %}
### Get your link
Send `/link`. The bot replies with a one-time link.
{% endstep %}

{% step %}
### Sign in & connect
Open the link, sign in with X, and tap **Connect**.
{% endstep %}

{% step %}
### Done
You'll get a ✅ confirmation right in the chat. Start asking.
{% endstep %}
{% endstepper %}

## What you can ask

The bot runs StackAI's crypto skills — just chat naturally:

| Ask | What you get |
|---|---|
| "report 0x… " / "price of 0x…?" | price, market cap, liquidity, 24h volume |
| "is 0x… safe?" / "rug check 0x…" | honeypot, taxes, ownership risks, holder concentration, LP lock |
| "what's trending on base?" | trending tokens / top movers |
| "defi tvl on base?" | total + chain TVL, top protocols |

## Notes

* Skills are **read-only** and **informational, not financial advice** — always DYOR.
* A daily message limit applies per account.
* One Telegram account links to one StackAI account.
