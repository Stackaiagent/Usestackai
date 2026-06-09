<div align="center">

# StackAI

**An AI agent for your terminal, editor, and Telegram — that does real work through skills.**

Describe what you want. It reads and edits your code, runs commands you approve, pulls live on-chain data, and remembers your preferences across sessions.

[![npm](https://img.shields.io/npm/v/stackai?color=e8ff47)](https://www.npmjs.com/package/stackai)
[![downloads](https://img.shields.io/npm/dt/stackai?color=e8ff47)](https://www.npmjs.com/package/stackai)
[![license](https://img.shields.io/badge/license-MIT-blue)](./LICENSE)
[![node](https://img.shields.io/badge/node-%3E%3D20-green)](#)

[Website](https://usestackai.com) · [Docs](https://docs.usestackai.com) · [Telegram](https://t.me/StackAIagent_bot) · [X / @askstackai](https://x.com/askstackai)

</div>

---

## Quick start

```bash
npm install -g stackai     # requires Node 20+
stackai login              # paste your API key (get one at usestackai.com)
stackai                    # start an interactive session
```

```bash
stackai "add input validation to all the API routes"   # one-shot
```

> Get a free API key by signing in with X at **[usestackai.com](https://usestackai.com)** (50 requests/day on the free tier).

## What it does

- 🖥️ **Terminal agent** — reads, writes, edits files and runs commands (with your approval). Multi-file, all local.
- 🧩 **Skills** — load a [skill](https://docs.usestackai.com/skills) for a task. 10 built in (token reports, rug checks, market data, DeFi TVL, Bankr…), and `stackai skill add <repo>` installs more from any GitHub repo.
- 🧠 **Memory** — remembers your preferences and project facts across sessions (`remember` / `forget`, local only).
- 🔀 **Multi-model** — runs on Xiaomi MiMo by default; `/model` switches to Venice (bring your own key).
- 🏦 **Bankr** — trade, transfer, or launch a token through your own Bankr wallet (your key stays on your machine).
- 💬 **Telegram** — read-only crypto skills on the go via [@StackAIagent_bot](https://t.me/StackAIagent_bot).
- 🎨 **Vibe (web)** — chat to generate a project, see a live preview, download a `.zip`.

## How it works

The agent loop runs **locally** in the CLI; model calls route through StackAI's API so rate limiting and the model key stay server-side. The same engine runs server-side for the Telegram bot.

```
CLI (local agent loop) ──► StackAI API proxy ──► Xiaomi MiMo
   tools: read/write/edit · grep/glob · run_command · load_skill · remember/forget
```

Full concepts: **[docs.usestackai.com](https://docs.usestackai.com)**.

## Monorepo

```
apps/
  web/        Next.js — landing, login, dashboard, Vibe (Vercel)
  api/        Hono server — auth, rate limit, MiMo proxy (Railway)
  bot/        Telegram bot — runs skills server-side (Railway)
packages/
  core/       Shared agent logic — LLMClient, FileAgent, AgentRunner, SkillRegistry, MemoryStore
  cli/        `stackai` — the CLI (published to npm)
  skills/     Built-in skills (SKILL.md runbooks)
  vscode/     VS Code extension
infra/
  supabase/   SQL migrations + RLS
```

Package manager **pnpm** · build **Turborepo** · **TypeScript** strict everywhere.

## Local development

```bash
pnpm install
# Configure env (see SETUP.md): apps/api/.env, apps/web/.env.local
# Apply DB schema: run infra/supabase/migrations/*.sql in Supabase

pnpm --filter @stackai/api dev    # API on :8787
pnpm --filter @stackai/web dev    # Web on :3000
pnpm --filter @stackai/core build && pnpm --filter stackai build   # build the CLI
```

Full setup + deployment guide: **[SETUP.md](./SETUP.md)**.

## Tech

Next.js · Hono · grammY · Supabase (Postgres) · Upstash Redis · Xiaomi MiMo · Venice · Bankr · ink · tsup.

## License

MIT © StackAI
