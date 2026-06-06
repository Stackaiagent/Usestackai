import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { env } from "./env.js";
import type { Tier } from "./tiers.js";

let client: SupabaseClient | null = null;

/**
 * Supabase client using the service role key — bypasses RLS.
 * Lazily constructed; throws if Supabase isn't configured (dev mode).
 */
export function getDb(): SupabaseClient {
  if (!env.hasSupabase) {
    throw new Error("Supabase is not configured");
  }
  if (!client) {
    client = createClient(env.supabaseUrl!, env.supabaseServiceKey!, {
      auth: { persistSession: false },
    });
  }
  return client;
}

export interface UserRow {
  id: string;
  x_id: string;
  x_username: string;
  x_name: string | null;
  avatar_url: string | null;
  tier: Tier;
  created_at: string;
}

export interface ApiKeyRow {
  id: string;
  user_id: string;
  name: string;
  key_hash: string;
  key_prefix: string;
  last_used_at: string | null;
  created_at: string;
}

/** The authenticated principal attached to a request after apiKeyAuth. */
export interface AuthContext {
  key: ApiKeyRow;
  user: UserRow;
}
