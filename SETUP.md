# StackAI — Setup Guide

How to go from the current build to a real **web → register → API key → CLI** flow.

The CLI already works end-to-end in **dev mode** (API accepts any key, in-memory rate limit). This guide covers wiring the **real** auth + key persistence, then deploying and publishing.

---

## Phase A — Real auth + keys (local)

You need to create 3 external accounts and paste their credentials into `.env` files. Claude (me) can't create these for you — but once you have the keys, I'll wire and test everything.

### A1. Supabase (database + key storage)
1. Create a project at https://supabase.com → **New project**.
2. Project Settings → **API**, copy:
   - `Project URL` → `SUPABASE_URL`
   - `service_role` secret → `SUPABASE_SERVICE_KEY`
   - `anon` public key → `SUPABASE_ANON_KEY`
3. SQL Editor → run, in order:
   - `infra/supabase/migrations/0001_init.sql`
   - `infra/supabase/migrations/0002_rls.sql`

### A2. X (Twitter) OAuth app (login)
1. https://developer.x.com → create an app with **OAuth 2.0**.
2. Set the callback / redirect URL to:
   - `http://localhost:3000/api/auth/callback/twitter` (local)
   - (add your production URL later)
3. Copy:
   - `Client ID` → `TWITTER_CLIENT_ID`
   - `Client Secret` → `TWITTER_CLIENT_SECRET`

### A3. Upstash Redis (rate limiting) — optional locally
Without it the API uses an in-memory limiter (fine for local). For production:
1. https://upstash.com → create a Redis database.
2. Copy REST URL → `UPSTASH_REDIS_URL`, REST token → `UPSTASH_REDIS_TOKEN`.

### A4. Fill env (single file — API is folded into the web app)
**`apps/web/.env.local`** holds everything (UI + API):
```env
NEXTAUTH_SECRET=               # generate: openssl rand -base64 32
NEXTAUTH_URL=http://localhost:3000
TWITTER_CLIENT_ID=...
TWITTER_CLIENT_SECRET=...
SUPABASE_URL=...
SUPABASE_SERVICE_KEY=...
SUPABASE_ANON_KEY=...
MIMO_API_KEY=tp-...
UPSTASH_REDIS_URL=...          # optional locally (falls back to in-memory)
UPSTASH_REDIS_TOKEN=...        # optional locally
```

### A5. Test the real flow
1. `pnpm --filter @stackai/web run dev`  → serves UI **and** API on :3000
2. Open http://localhost:3000 → **Sign in with X** → dashboard → **Create key** → copy it.
3. `stackai auth <that_key> http://localhost:3000`
4. `stackai whoami` → should show your real X username + tier.
5. `stackai "create hello.js"` → works, usage tracked in Supabase/Upstash.

---

## Phase B — Deploy (single Vercel deployment)

Everything is one Next.js app, so there's **one deploy**:

1. **Vercel → New Project** → import the GitHub repo.
2. Set **Root Directory** to `apps/web`.
3. Add **Environment Variables** (the same keys as `apps/web/.env.local`) in
   the Vercel dashboard — do NOT commit `.env.local`. Set `NEXTAUTH_URL` to the
   production domain.
4. Deploy → you get a URL like `https://stackai.vercel.app` (or your domain).
5. In the **X Developer portal**, add the production callback:
   `https://<your-domain>/api/auth/callback/twitter`.
6. Set the CLI default in `packages/cli/src/config.ts` (`DEFAULT_API_URL`) to
   your domain so users don't need to pass a URL.

No separate API host (Railway) needed — the API routes deploy with the web app.

## Phase C — Publish the CLI

`stackai` is available on npm. Once Phase B is live:
```bash
cd packages/cli
pnpm build
npm publish        # first time may need: npm login
```
Then anyone can:
```bash
npm install -g stackai
stackai auth <their_key>
stackai
```

## Phase D — Docs/Install page ✅ done

`/install` page is built (tutorial + command reference). The landing "Install CLI" button links to it.
