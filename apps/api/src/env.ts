/**
 * Validated environment for the API server.
 *
 * Only MIMO_API_KEY is strictly required. If Supabase / Upstash are not
 * configured, the server boots in DEV MODE: API keys are accepted without a
 * database lookup and rate limiting falls back to an in-memory store. This
 * lets you run + test the CLI end-to-end with just a MiMo key.
 */

function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;
const upstashRedisUrl = process.env.UPSTASH_REDIS_URL;
const upstashRedisToken = process.env.UPSTASH_REDIS_TOKEN;

const hasSupabase = Boolean(supabaseUrl && supabaseServiceKey);
const hasRedis = Boolean(upstashRedisUrl && upstashRedisToken);

// SAFETY: dev mode (accept any key, in-memory rate limit) must be opted into
// EXPLICITLY with STACKAI_DEV=1. This does NOT rely on NODE_ENV (which a host
// may not set), so a misconfigured production can never silently fail open.
const allowDevMode =
  process.env.STACKAI_DEV === "1" || process.env.STACKAI_DEV === "true";

if (!hasSupabase && !allowDevMode) {
  throw new Error(
    "SUPABASE_URL and SUPABASE_SERVICE_KEY are required. " +
      "Set STACKAI_DEV=1 to run in local fail-open dev mode.",
  );
}
const isDev = !hasSupabase && allowDevMode;

export const env = {
  mimoApiKey: required("MIMO_API_KEY"),
  mimoBaseUrl:
    process.env.MIMO_BASE_URL ?? "https://token-plan-sgp.xiaomimimo.com/v1",
  supabaseUrl,
  supabaseServiceKey,
  upstashRedisUrl,
  upstashRedisToken,
  webOrigins: (process.env.WEB_ORIGIN ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean),
  hasSupabase,
  hasRedis,
  isDev,
  port: Number(process.env.PORT ?? 8787),
} as const;

if (env.isDev) {
  console.warn(
    "[StackAI API] DEV MODE (non-production) — no Supabase configured. " +
      "API keys are accepted without verification and rate limiting is in-memory.",
  );
}
