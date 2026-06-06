import { createMiddleware } from "hono/factory";
import { env } from "../env.js";
import { getDb, type ApiKeyRow, type UserRow } from "../db.js";
import { hashApiKey, keyPrefix } from "../keys.js";
import { UnauthorizedError } from "../errors.js";
import type { AppVariables } from "../types.js";

/**
 * Validates the `Authorization: Bearer <api_key>` header.
 *
 * Production: looks up the key by its sha256 hash, loads the owning user, and
 * refreshes last_used_at.
 *
 * Dev mode (no Supabase): any non-empty key is accepted as a synthetic free-tier
 * user so the CLI can be exercised end-to-end with just a MiMo key.
 */
export const apiKeyAuth = createMiddleware<{ Variables: AppVariables }>(
  async (c, next) => {
    const header = c.req.header("Authorization");
    if (!header?.startsWith("Bearer ")) {
      throw new UnauthorizedError();
    }
    const rawKey = header.slice("Bearer ".length).trim();
    if (!rawKey) {
      throw new UnauthorizedError();
    }

    if (env.isDev) {
      c.set("auth", devAuth(rawKey));
      await next();
      return;
    }

    const db = getDb();
    const { data: key } = await db
      .from("api_keys")
      .select("*")
      .eq("key_hash", hashApiKey(rawKey))
      .maybeSingle<ApiKeyRow>();

    if (!key) {
      throw new UnauthorizedError();
    }

    const { data: user } = await db
      .from("users")
      .select("*")
      .eq("id", key.user_id)
      .maybeSingle<UserRow>();

    if (!user) {
      throw new UnauthorizedError("API key has no associated user");
    }

    c.set("auth", { key, user });

    // Fire-and-forget, but swallow errors so a transient DB blip can't become
    // an unhandled promise rejection that crashes the process.
    void db
      .from("api_keys")
      .update({ last_used_at: new Date().toISOString() })
      .eq("id", key.id)
      .then(
        () => {},
        () => {},
      );

    await next();
  },
);

function devAuth(rawKey: string): {
  key: ApiKeyRow;
  user: UserRow;
} {
  const now = new Date().toISOString();
  return {
    key: {
      id: `dev-${hashApiKey(rawKey).slice(0, 12)}`,
      user_id: "dev-user",
      name: "Dev",
      key_hash: hashApiKey(rawKey),
      key_prefix: keyPrefix(rawKey),
      last_used_at: now,
      created_at: now,
    },
    user: {
      id: "dev-user",
      x_id: "dev",
      x_username: "dev",
      x_name: "Dev User",
      avatar_url: null,
      tier: "free",
      created_at: now,
    },
  };
}
