-- StackAI initial schema
-- Tables: users, api_keys, usage, vibe_projects

-- ─────────────────────────────────────────────
-- users
-- ─────────────────────────────────────────────
create table if not exists users (
  id          uuid primary key default gen_random_uuid(),
  x_id        text unique not null,
  x_username  text not null,
  x_name      text,
  avatar_url  text,
  tier        text not null default 'free' check (tier in ('free', 'builder', 'unlimited')),
  created_at  timestamptz not null default now()
);

-- ─────────────────────────────────────────────
-- api_keys
-- ─────────────────────────────────────────────
create table if not exists api_keys (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references users(id) on delete cascade,
  name         text not null default 'Default',
  key_hash     text unique not null,   -- sha256 of the actual key
  key_prefix   text not null,          -- first 12 chars for display: sk_live_xxxx
  last_used_at timestamptz,
  created_at   timestamptz not null default now()
);

create index if not exists api_keys_user_id_idx on api_keys (user_id);
create index if not exists api_keys_key_hash_idx on api_keys (key_hash);

-- ─────────────────────────────────────────────
-- usage (rate limiting / daily counts)
-- ─────────────────────────────────────────────
create table if not exists usage (
  id      uuid primary key default gen_random_uuid(),
  key_id  uuid not null references api_keys(id) on delete cascade,
  date    date not null default current_date,
  count   int not null default 0,
  unique (key_id, date)
);

create index if not exists usage_key_id_date_idx on usage (key_id, date);

-- ─────────────────────────────────────────────
-- vibe_projects (saved vibecoding sessions)
-- ─────────────────────────────────────────────
create table if not exists vibe_projects (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references users(id) on delete cascade,
  name       text,
  files      jsonb not null default '[]'::jsonb,  -- array of { path, content }
  created_at timestamptz not null default now()
);

create index if not exists vibe_projects_user_id_idx on vibe_projects (user_id);
