import { Hono } from "hono";
import { apiKeyAuth } from "../middleware/api-key-auth.js";
import { store, today } from "../store.js";
import { tierLimit } from "../tiers.js";
import type { AppVariables } from "../types.js";

export const usageRoutes = new Hono<{ Variables: AppVariables }>();

/**
 * GET /usage
 * Today's request count for the authenticated key + the tier limit.
 */
usageRoutes.get("/", apiKeyAuth, async (c) => {
  const { key, user } = c.get("auth");
  const used = await store.get(`usage:${key.id}:${today()}`);
  const limit = tierLimit(user.tier);

  return c.json({
    date: today(),
    tier: user.tier,
    used,
    limit: limit === Number.POSITIVE_INFINITY ? null : limit,
    remaining:
      limit === Number.POSITIVE_INFINITY ? null : Math.max(0, limit - used),
  });
});
