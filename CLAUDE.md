# StackAI — Project Brief for Claude Code

## What is StackAI?

StackAI is an AI coding agent platform powered by Xiaomi MiMo v2.5 Pro (via Xiaomi's dedicated endpoint). Users can interact with the AI through three surfaces:

1. **CLI** — `npm install -g stackai`, authenticate with API key, run prompts in terminal
2. **VSCode Extension** — sidebar panel, agent commands inside the editor
3. **Web App** — Vibecoding interface (chat → generate project → download .zip) + dashboard

Auth is via **X (Twitter) OAuth**. Rate limiting is per API key (50 req/day free tier). No wallet/token system yet — that comes later.

---

## Monorepo Structure

```
stackai/
├── apps/
│   ├── web/              # Next.js 15 app (landing + dashboard + vibecoding)
│   └── api/              # Hono API server (agent orchestration + auth)
├── packages/
│   ├── core/             # Shared agent logic (LLM, file tools, runner)
│   ├── cli/              # CLI package (published to npm as `stackai`)
│   └── vscode/           # VSCode extension
├── infra/
│   └── supabase/         # DB migrations and schema
├── package.json          # pnpm workspace root
└── CLAUDE.md             # this file
```

Package manager: **pnpm workspaces**
Runtime: **Node.js 20+**
Language: **TypeScript** everywhere

---

## Tech Stack

| Layer | Tech |
|---|---|
| Web frontend | Next.js 15, React 19, Tailwind CSS |
| API server | Hono (Node.js), deployed on Railway |
| Database | Supabase (Postgres + Auth) |
| AI provider | Xiaomi MiMo (dedicated endpoint) — model: `mimo-v2.5-pro` |
| Auth | NextAuth v5 + X OAuth provider |
| Rate limiting | Upstash Redis |
| CLI | Node.js + TypeScript, ink (terminal UI) |
| VSCode ext | VSCode Extension API + TypeScript |
| File download | JSZip (vibecoding .zip export) |
| Monorepo | pnpm workspaces + Turborepo |
| Deploy web | Vercel |
| Deploy API | Railway |

---

## packages/core

Shared logic used by CLI, VSCode, and API.

### LLMClient
```typescript
// Wraps Xiaomi MiMo dedicated endpoint — OpenAI-compatible format
const client = new LLMClient({
  apiKey: process.env.MIMO_API_KEY,
  model: 'mimo-v2.5-pro',
  baseURL: 'https://token-plan-sgp.xiaomimimo.com/v1',
})

// Supports streaming
await client.stream(messages, onChunk)
```

### FileAgent
```typescript
// Tools the AI can call
fileAgent.readFile(path)
fileAgent.writeFile(path, content)
fileAgent.editFile(path, oldStr, newStr)
fileAgent.listFiles(dir)
fileAgent.createDir(path)
```

### AgentRunner
```typescript
// Main execution loop
const runner = new AgentRunner({ llm, fileAgent })
await runner.run({
  prompt: "refactor api.ts to use async/await",
  cwd: process.cwd(),
  onStep: (step) => console.log(step),
})
```

Tool call loop:
1. Send system prompt + user prompt to MiMo
2. Parse tool calls from response
3. Execute file tools
4. Feed results back to MiMo
5. Repeat until `finish_reason: stop`

---

## apps/api

Hono server. All endpoints require `Authorization: Bearer <api_key>` header.

### Endpoints

```
POST /auth/verify          # Validate API key → return user info
POST /agent/run            # Stream agent response (SSE)
POST /agent/vibe           # Vibecoding: generate project files
GET  /usage                # Get today's usage count for key
```

### Middleware stack
```
requestLogger → apiKeyAuth → rateLimiter → handler
```

### Rate limiting logic
```typescript
// Per API key per day
const key = `usage:${apiKeyId}:${today}`
const count = await redis.incr(key)
await redis.expire(key, 86400)
if (count > tier.limit) throw new RateLimitError()
```

### Tier limits
```typescript
const TIERS = {
  free:      { limit: 50 },
  builder:   { limit: 200 },
  unlimited: { limit: Infinity },
}
```

### Vibe endpoint response
```typescript
// Returns array of generated files
{
  files: [
    { path: 'index.html', content: '...' },
    { path: 'styles.css', content: '...' },
    { path: 'main.js',    content: '...' },
  ],
  summary: 'Generated 3 files for a SaaS landing page'
}
```

---

## apps/web

Next.js 15 app with App Router.

### Routes
```
/                    # Landing page (public)
/login               # X OAuth login
/dashboard           # API key management + usage stats (protected)
/vibe                # Vibecoding interface (protected)
```

### Landing page sections
1. Hero — headline "Think it. Type it. Done.", terminal preview, 2 CTAs
2. Marquee ticker
3. CLI section — terminal demo
4. Vibe Coding section — chat UI mockup
5. Build Agent section — agent step tracker
6. Install section — CLI + VSCode tabs
7. CTA banner
8. Footer

Design: black background, white text, `#e8ff47` acid yellow accent, Space Grotesk + JetBrains Mono fonts.

### Dashboard
- List of API keys (name, created date, last used, usage today)
- Create new key button → generates `sk_live_xxxxxxxxxxxxxxxx`
- Revoke key button
- Usage bar per key (e.g. 23/50 today)
- Copy key button (shown once on creation)

### Vibecoding page
```
┌─────────────────────────────────────────────────────┐
│  [file tree sidebar]  │  [chat panel]               │
│                       │                             │
│  index.html           │  You: build me a todo app   │
│  styles.css           │                             │
│  main.js              │  StackAI: Done! 3 files...  │
│                       │  [Download .zip]            │
│                       │  [prompt input]             │
└─────────────────────────────────────────────────────┘
```

---

## packages/cli

Published as `stackai` on npm.

### Commands
```bash
stackai auth <api_key>          # Save key to ~/.stackai/config.json
stackai whoami                  # Show current user + usage
stackai "your prompt here"      # Run agent in current directory
stackai --help
stackai --version
```

### Config file
```json
// ~/.stackai/config.json
{
  "apiKey": "sk_live_xxxxxxxxxxxx",
  "apiUrl": "https://api.stackai.build"
}
```

### Output format
```
$ stackai "add input validation to all routes"

  StackAI  Reading project...
           Found 6 route files

  Plan     1. Create validation middleware
           2. Update 6 route handlers
           3. Add zod schemas

  Writing  src/middleware/validate.ts       ✓
           src/routes/auth.ts               ✓
           src/routes/users.ts              ✓
           + 4 more files

  Done     7 files modified · 0 errors · 2.3s
```

Use `ink` for terminal UI rendering.

---

## packages/vscode

VSCode extension ID: `stackai.stackai`

### Commands (Command Palette)
```
StackAI: Set API Key      # Prompt → save to SecretStorage
StackAI: Open Panel       # Open sidebar (Ctrl+Shift+A)
StackAI: Run on File      # Run agent on currently open file
```

### Sidebar panel
- Chat input at bottom
- Message history above
- Shows file diffs inline when agent edits files
- Streaming output token by token

### How it calls the API
```typescript
// Same as CLI — hits apps/api
const response = await fetch('https://api.stackai.build/agent/run', {
  method: 'POST',
  headers: { Authorization: `Bearer ${apiKey}` },
  body: JSON.stringify({ prompt, cwd: workspaceRoot }),
})
// Read SSE stream
```

---

## infra/supabase

### Schema

```sql
-- users
create table users (
  id          uuid primary key default gen_random_uuid(),
  x_id        text unique not null,
  x_username  text not null,
  x_name      text,
  avatar_url  text,
  tier        text default 'free',   -- free | builder | unlimited
  created_at  timestamptz default now()
);

-- api_keys
create table api_keys (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references users(id) on delete cascade,
  name        text not null default 'Default',
  key_hash    text unique not null,  -- sha256 of actual key
  key_prefix  text not null,         -- first 12 chars for display: sk_live_xxxx
  last_used_at timestamptz,
  created_at  timestamptz default now()
);

-- usage (rate limiting)
create table usage (
  id          uuid primary key default gen_random_uuid(),
  key_id      uuid references api_keys(id) on delete cascade,
  date        date not null default current_date,
  count       int default 0,
  unique(key_id, date)
);

-- vibe_projects (vibecoding saved sessions)
create table vibe_projects (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references users(id) on delete cascade,
  name        text,
  files       jsonb,   -- array of {path, content}
  created_at  timestamptz default now()
);
```

### Row Level Security
- Users can only read/write their own rows
- API server uses service role key (bypasses RLS)
- Web app uses anon key + session

---

## Environment Variables

### apps/api
```env
SUPABASE_URL=
SUPABASE_SERVICE_KEY=
MIMO_API_KEY=
UPSTASH_REDIS_URL=
UPSTASH_REDIS_TOKEN=
```

### apps/web
```env
NEXTAUTH_SECRET=
NEXTAUTH_URL=
TWITTER_CLIENT_ID=
TWITTER_CLIENT_SECRET=
SUPABASE_URL=
SUPABASE_ANON_KEY=
NEXT_PUBLIC_API_URL=https://api.stackai.build
```

---

## API Key Format

```
sk_live_<16 random hex chars>
```

Example: `sk_live_4a8f3c2e1b9d7e5f`

- Never store raw key in DB — only store `sha256(key)` + first 12 chars as prefix
- Show full key only once on creation
- Display as `sk_live_4a8f****` everywhere else

---

## Build Order

Build in this sequence — each step depends on the previous:

```
1. infra/supabase       → run migrations, set up RLS
2. packages/core        → LLMClient + FileAgent + AgentRunner
3. apps/api             → auth middleware + /agent/run endpoint
4. apps/web (auth)      → X OAuth + dashboard + key generation
5. packages/cli         → auth command + agent command
6. apps/web (vibe)      → vibecoding page + .zip download
7. packages/vscode      → sidebar panel + commands
```

---

## Code Conventions

- TypeScript strict mode everywhere (`"strict": true`)
- No `any` types — use `unknown` + type guards
- Async/await only — no raw `.then()` chains
- Error handling: always use typed error classes
- File naming: `kebab-case.ts`
- Exports: named exports preferred, default export only for Next.js pages/components
- Comments: only for non-obvious logic, not for obvious code
- Environment: never hardcode secrets, always use env vars

---

## Future: Token System (Phase 2)

> **Status: NOT built yet.** This is planned for after the core product has users.
> When the time comes, Claude Code should reference this section and create a TODO list.

### Overview

StackAI will launch an ERC-20 token on Base blockchain. Token holders can **stake** tokens to unlock higher rate limit tiers — replacing the subscription model.

### Why Staking (not just holding)

Holding tokens can be gamed (hold → use → transfer to new wallet → repeat).
Staking locks tokens in a smart contract — rate limits are tied to **staked balance**, not wallet balance. No stake = no tier upgrade.

### Tier System (token-based)

```
Free tier      →  0 tokens staked    →  50 req/day    (same as now)
Builder tier   →  1,000 staked       →  200 req/day
Pro tier       →  5,000 staked       →  500 req/day
Unlimited tier →  10,000 staked      →  unlimited
```

### Burn Mechanism

Every API request burns a small amount of tokens from the user's staked balance automatically — no manual transaction needed. This makes token utility real and creates deflationary pressure.

```
Each request → burn X tokens from staked balance
If staked balance < tier minimum → auto-downgrade to lower tier
```

### Smart Contract (to be built — Solidity, deploy on Base)

```solidity
// Functions needed:
stake(uint256 amount)           // lock tokens, update tier
unstake(uint256 amount)         // withdraw (7-day cooldown)
burnFromStake(address, uint256) // called by backend per request
getStakedAmount(address)        // query for tier check
getTier(address)                // returns current tier
```

Cooldown on unstake (7 days) prevents abuse (stake → use → unstake immediately).

`burnFromStake` is called by the API server using a trusted backend wallet — not by the user.

### Auth Flow Update (Phase 2)

Current: Sign in with X → dashboard → API key

Updated:
```
Sign in with X (unchanged)
  └── optional: Connect wallet (new button in dashboard)
        └── Stake tokens → tier upgrades automatically
```

Wallet connect is additive — existing users are not broken.

### Frontend Changes Needed (Phase 2)

- Dashboard: add "Connect Wallet" button (use wagmi + viem)
- Dashboard: show staked balance + current tier + burn rate
- New page: `/stake` — stake/unstake UI with cooldown timer
- API key usage bar updates to reflect new tier limits

### Database Changes Needed (Phase 2)

```sql
-- add to users table
alter table users add column wallet_address text unique;
alter table users add column staked_amount  numeric default 0;

-- tier is now derived from staked_amount, not stored manually
```

### Token Launch (separate from this repo)

Token will be launched via Forge Launch (forgelaunch.build) on Base.
Contract address and token details will be added here once deployed.

### TODO Checklist for Phase 2

```
[ ] Deploy ERC-20 token on Base via Forge Launch
[ ] Write and audit staking smart contract
[ ] Deploy staking contract on Base
[ ] Add wallet_address + staked_amount to users table
[ ] Add /stake page to apps/web
[ ] Add wallet connect (wagmi) to dashboard
[ ] Update rate limit middleware to check on-chain staked balance
[ ] Add burnFromStake call to apps/api after each request
[ ] Update dashboard to show staked balance + tier
[ ] Update landing page to explain token tiers
```

---

## Notes for Claude Code

- Always check `packages/core` before writing LLM or file logic in other packages — reuse don't duplicate
- The MiMo API is OpenAI-compatible — use the `openai` npm package with custom `baseURL` (`https://token-plan-sgp.xiaomimimo.com/v1`). Xiaomi also exposes an Anthropic-compatible endpoint at `https://token-plan-sgp.xiaomimimo.com/anthropic` if ever needed.
- SSE streaming for `/agent/run` — use `ReadableStream` in Hono, consume with `EventSource` or `fetch` + `getReader()` on client
- Rate limiting must happen in `apps/api` middleware — CLI and VSCode trust the API to enforce it
- For the VSCode extension, never store API key in `settings.json` — always use `vscode.SecretStorage`
- The landing page design is already finalized — do not change colors, fonts, or layout structure
- Landing page accent color: `#e8ff47`, fonts: Space Grotesk + JetBrains Mono
