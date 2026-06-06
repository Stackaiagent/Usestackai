<div align="center">

# StackAI

**An AI coding agent that lives in your terminal.**

Describe what you want — it reads, writes, and edits your code. Plus a web "Vibe" mode to build whole projects by chatting.

[![npm](https://img.shields.io/npm/v/stackai?color=e8ff47)](https://www.npmjs.com/package/stackai)
[![license](https://img.shields.io/badge/license-MIT-blue)](./LICENSE)
[![node](https://img.shields.io/badge/node-%3E%3D20-green)](#)

[Website](https://usestackai.com) · [Docs](https://usestackai.com) · [X / @askstackai](https://x.com/askstackai)

</div>

---

## Quick start

```bash
npm install -g stackai     # requires Node 20+
stackai login              # paste your API key (get one at usestackai.com)
stackai                    # start an interactive session
```

Or run a single task and exit:

```bash
stackai "add input validation to all the API routes"
```

> Get a free API key by signing in with X at **[usestackai.com](https://usestackai.com)** (50 requests/day on the free tier).

## What it does

- 🖥️ **Terminal agent** — reads, writes, and edits files in your project. Multi-file changes, all local.
- 💬 **Interactive mode** — `stackai` opens a chat session that keeps full context across messages.
- 🔎 **Codebase-aware** — built-in `grep` + `glob` so it navigates large projects efficiently.
- 📄 **Project context** — drop a `STACKAI.md` (or `AGENTS.md`) in your repo and the agent follows it.
- 🎨 **Vibe (web)** — chat to generate a project, see a **live preview**, iterate, and download a `.zip`.
- 🔐 **Sign in with X**, manage API keys + usage from the dashboard.

## How it works

The agent loop runs **locally** in the CLI (using your files), while model calls are routed through StackAI's API so rate limiting and the model key stay server-side.

```
CLI (local agent loop: read/write/edit/grep/glob)
        │  Authorization: Bearer <api_key>
        ▼
StackAI API  ──►  proxy /api/v1/chat/completions  ──►  Xiaomi MiMo
```

## Monorepo

```
apps/
  web/        Next.js — landing, login, dashboard, Vibe (deployed on Vercel)
  api/        Hono server — auth, rate limit, MiMo proxy (deployed on Railway)
packages/
  core/       Shared agent logic — LLMClient, FileAgent, AgentRunner
  cli/        `stackai` — the CLI (published to npm)
  vscode/     VS Code extension
infra/
  supabase/   SQL migrations + RLS
```

Package manager **pnpm** · build **Turborepo** · **TypeScript** strict everywhere.

## Local development

```bash
pnpm install

# 1. Configure env (see SETUP.md): apps/api/.env and apps/web/.env.local
# 2. Apply the DB schema: run infra/supabase/migrations/*.sql in Supabase

pnpm --filter @stackai/api dev    # API on :8787
pnpm --filter @stackai/web dev    # Web on :3000
pnpm --filter @stackai/core build && pnpm --filter stackai build   # build the CLI
```

Point the CLI at your local API:

```bash
node packages/cli/dist/cli.js auth <key> http://localhost:8787
```

Full setup + deployment guide: **[SETUP.md](./SETUP.md)**.

## Tech

Next.js · Hono · Supabase (Postgres) · Upstash Redis · Xiaomi MiMo (`mimo-v2.5-pro`) · ink · tsup.

## License

MIT © StackAI
