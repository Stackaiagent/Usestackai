# stackai

**An AI agent for your terminal.** It reads and edits your code, runs commands you approve, pulls live on-chain data through skills, and remembers your preferences across sessions.

[![npm](https://img.shields.io/npm/v/stackai?color=e8ff47)](https://www.npmjs.com/package/stackai)
[![downloads](https://img.shields.io/npm/dt/stackai?color=e8ff47)](https://www.npmjs.com/package/stackai)
[![license](https://img.shields.io/badge/license-MIT-blue)](https://github.com/Stackaiagent/Usestackai/blob/main/LICENSE)

```bash
npm install -g stackai     # requires Node 20+
stackai login              # paste your API key (free at usestackai.com)
stackai                    # start an interactive session
```

Run a single task and exit:

```bash
stackai "add input validation to all the API routes"
```

> Sign in with X at **[usestackai.com](https://usestackai.com)** for a free API key (50 requests/day).

## What it does

- 🖥️ **Terminal agent** — reads, writes, edits files and runs commands (with your approval), all local.
- 🧩 **Skills** — 10 built in (token reports, rug checks, market data, DeFi TVL, Bankr…) and more coming. Install more from any GitHub repo: `stackai skill add <owner/repo>`.
- 🧠 **Memory** — remembers your preferences and project facts across sessions (local only).
- 🔀 **Multi-model** — runs on Xiaomi MiMo by default; `/model` switches to Venice (bring your own key).
- 🏦 **Bankr** — trade, transfer, or launch a token through your own Bankr wallet. Your key stays on your machine.
- 📄 **Project context** — drop a `STACKAI.md` in your repo and the agent follows it.

## Commands

| Command | What it does |
|---|---|
| `stackai` | Interactive session |
| `stackai "<prompt>"` | Run once, then exit |
| `stackai login` / `logout` / `whoami` | Auth |
| `stackai memory` | Show what the agent remembers |
| `stackai skill` / `skill add <repo>` | List / install skills |
| `stackai model [id]` · `venice set <key>` | Multi-model (Venice BYOK) |
| `stackai bankr set <bk_...>` | Connect your Bankr wallet |

In a session: `/model [id]` to switch models, `/exit` to leave.

## How it works

The agent loop runs **locally** in the CLI (on your files); model calls route through StackAI's API so rate limiting and the model key stay server-side. Every shell command is gated by an approval prompt (`y` / `a` / `n`).

## Links

- **Docs:** [docs.usestackai.com](https://docs.usestackai.com)
- **Web (Vibe):** [usestackai.com](https://usestackai.com)
- **Telegram:** [@StackAIagent_bot](https://t.me/StackAIagent_bot)
- **Source (open source):** [github.com/Stackaiagent/Usestackai](https://github.com/Stackaiagent/Usestackai)

## License

MIT © StackAI
