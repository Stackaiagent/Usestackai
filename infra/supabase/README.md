# infra/supabase

Database schema + migrations for StackAI.

## Migrations

| File | What |
|---|---|
| `migrations/0001_init.sql` | Core tables: `users`, `api_keys`, `usage`, `vibe_projects` |
| `migrations/0002_rls.sql` | Row Level Security policies |

## Applying

### Option A — Supabase SQL Editor
Paste each file (in order) into the SQL editor of your Supabase project and run.

### Option B — Supabase CLI
```bash
supabase db push
# or run a single file:
supabase db execute --file migrations/0001_init.sql
```

## Access model

- **API server** (`apps/api`) uses the **service role key** → bypasses RLS, enforces its own auth via `apiKeyAuth` middleware.
- **Web app** (`apps/web`) uses the **anon key** + Supabase session → RLS restricts each user to their own rows.

## Notes

- API keys are never stored raw — only `sha256(key)` in `key_hash` plus the first 12 chars in `key_prefix`. See the API Key Format reference.
- `vibe_projects.files` is a JSONB array of `{ path, content }`.
