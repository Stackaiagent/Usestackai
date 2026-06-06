import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Server-side Supabase client using the service role key. Used inside
 * server actions / route handlers that already verified the NextAuth session,
 * so they act as a trusted backend (bypassing RLS).
 *
 * NEVER import this into a client component.
 *
 * Constructed LAZILY (on first use) via a Proxy so that importing this module
 * at build time — when env vars aren't present — doesn't throw. The real
 * client is created on the first property access at request time.
 */
let client: SupabaseClient | null = null;

function getClient(): SupabaseClient {
  if (!client) {
    client = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_KEY!,
      { auth: { persistSession: false } },
    );
  }
  return client;
}

export const supabaseAdmin: SupabaseClient = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    const real = getClient();
    const value = Reflect.get(real, prop, real) as unknown;
    return typeof value === "function"
      ? (value as (...args: unknown[]) => unknown).bind(real)
      : value;
  },
});
