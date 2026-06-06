import { createMiddleware } from "hono/factory";
import { store, today } from "../store.js";
import { tierLimit } from "../tiers.js";
import { RateLimitError } from "../errors.js";
import type { AppVariables } from "../types.js";

/**
 * Per-API-key, per-day rate limit.
 *
 *   key   = usage:<apiKeyId>:<YYYY-MM-DD>
 *   count = store.incr(key)
 *
 * Backed by Redis when configured, otherwise an in-memory store (dev mode).
 * This is the single source of truth — CLI and VSCode trust the API to
 * enforce it. Unlimited-tier keys skip the check entirely.
 */
export const rateLimiter = createMiddleware<{ Variables: AppVariables }>(
  async (c, next) => {
    const { key, user } = c.get("auth");
    const limit = tierLimit(user.tier);

    if (limit !== Number.POSITIVE_INFINITY) {
      const redisKey = `usage:${key.id}:${today()}`;
      const count = await store.incr(redisKey, 86_400);
      if (count > limit) {
        throw new RateLimitError(limit, count);
      }
      c.header("X-RateLimit-Limit", String(limit));
      c.header("X-RateLimit-Remaining", String(Math.max(0, limit - count)));
    }

    await next();
  },
);
