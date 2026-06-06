-- Row Level Security
--
-- Model:
--   * The API server connects with the SERVICE ROLE key, which bypasses RLS
--     entirely — it is the trusted backend and enforces its own auth.
--   * The web app connects with the ANON key + a Supabase session, where
--     auth.uid() maps to the authenticated user. Policies below restrict the
--     web client to only its own rows.
--
-- NOTE: this assumes users.id is aligned with the Supabase auth user id.
-- If you mint app users separately from auth.users, adapt the using() clauses.

alter table users          enable row level security;
alter table api_keys       enable row level security;
alter table usage          enable row level security;
alter table vibe_projects  enable row level security;

-- ── users ───────────────────────────────────────────────────
create policy "users select own"
  on users for select
  using (auth.uid() = id);

create policy "users update own"
  on users for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- ── api_keys ────────────────────────────────────────────────
create policy "api_keys select own"
  on api_keys for select
  using (auth.uid() = user_id);

create policy "api_keys insert own"
  on api_keys for insert
  with check (auth.uid() = user_id);

create policy "api_keys delete own"
  on api_keys for delete
  using (auth.uid() = user_id);

-- ── usage (read-only for the owner via their keys) ──────────
create policy "usage select own"
  on usage for select
  using (
    exists (
      select 1 from api_keys k
      where k.id = usage.key_id and k.user_id = auth.uid()
    )
  );

-- ── vibe_projects ───────────────────────────────────────────
create policy "vibe_projects select own"
  on vibe_projects for select
  using (auth.uid() = user_id);

create policy "vibe_projects insert own"
  on vibe_projects for insert
  with check (auth.uid() = user_id);

create policy "vibe_projects delete own"
  on vibe_projects for delete
  using (auth.uid() = user_id);
