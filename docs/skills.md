---
icon: puzzle-piece
description: What skills are, how the agent uses them, and the crypto skills built in.
---

# Skills

A **skill** is a small runbook — a `SKILL.md` file — that teaches the agent how to do a specific task: what to do, which API to call, how to handle the edge cases. The agent is the brain; a skill is a focused set of instructions plus, optionally, a script to run.

This is why StackAI can do new things without a new release. A skill is just content. The built-in skills ship with the CLI, and you can [install more](installing-skills.md) from any GitHub repo.

## How the agent uses a skill

1. At startup, StackAI builds a short index of every skill's **name + description** and shows it to the model.
2. When your request matches a skill, the model calls `load_skill` to read the full runbook.
3. It follows the steps — usually running a bundled script via `run_command` (which you approve) — and presents the result.

You never have to "invoke" a skill manually. Just ask naturally ("is this token a rug?") and the agent picks the right one.

## Built-in crypto skills

All of these are **read-only** and use **free public APIs** (no key needed).

| Skill | What it does | Source |
|---|---|---|
| `token-report` | Price, market cap, liquidity, 24h volume for a token address | Dexscreener |
| `token-safety` | Honeypot, buy/sell tax, ownership risks, holder concentration, LP lock | GoPlus |
| `market-pulse` | Trending tokens and movers on a chain | GeckoTerminal |
| `defi-overview` | Total + per-chain TVL, top protocols | DeFiLlama |
| `bankr-launches` | Recent Bankr token launches and creator fees | Bankr public API |

And one that uses **your own key** for real actions:

| Skill | What it does |
|---|---|
| `bankr` | Trade, transfer, or launch a token through your own Bankr wallet — see [Bankr](bankr.md) |

{% hint style="info" %}
Run `stackai skill` any time to list every skill currently available (built-in + installed).
{% endhint %}

## Read-only vs. write skills (capabilities)

Every skill declares its **capabilities** in its frontmatter (e.g. `external_api`, `onchain_writes`). StackAI uses this to keep surfaces safe:

* **Telegram is read-only.** Skills that can move funds (`onchain_writes`, like `bankr`) are **not loaded** there. Trading and launches happen only on the CLI, where your key never leaves your machine.
* On the CLI, write skills are available, and every command still goes through the approval prompt.

## Next

{% content-ref url="installing-skills.md" %}
[installing-skills.md](installing-skills.md)
{% endcontent-ref %}

{% content-ref url="bankr.md" %}
[bankr.md](bankr.md)
{% endcontent-ref %}
