import { Hono } from "hono";
import { apiKeyAuth } from "../middleware/api-key-auth.js";
import { maskKey } from "../keys.js";
import type { AppVariables } from "../types.js";

export const authRoutes = new Hono<{ Variables: AppVariables }>();

/**
 * POST /auth/verify
 * Validates the API key (via apiKeyAuth) and returns the user it belongs to.
 */
authRoutes.post("/verify", apiKeyAuth, (c) => {
  const { user, key } = c.get("auth");
  return c.json({
    valid: true,
    user: {
      id: user.id,
      username: user.x_username,
      name: user.x_name,
      avatarUrl: user.avatar_url,
      tier: user.tier,
    },
    key: {
      id: key.id,
      name: key.name,
      prefix: maskKey(key.key_prefix),
    },
  });
});
