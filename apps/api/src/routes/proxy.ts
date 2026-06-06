import { Hono } from "hono";
import { apiKeyAuth } from "../middleware/api-key-auth.js";
import { rateLimiter } from "../middleware/rate-limiter.js";
import { BadRequestError } from "../errors.js";
import { env } from "../env.js";
import type { AppVariables } from "../types.js";

export const proxyRoutes = new Hono<{ Variables: AppVariables }>();

// Guardrails so a client can't run up an unbounded MiMo bill.
const MAX_BODY_BYTES = 4_000_000; // ~4 MB request cap
const MAX_OUTPUT_TOKENS = 16_000; // clamp max_tokens
const MODEL_PREFIX = "mimo"; // only allow MiMo models for now

/**
 * POST /v1/chat/completions
 *
 * OpenAI-compatible proxy to Xiaomi MiMo. The CLI / VSCode point their LLM
 * client's baseURL at `<api>/v1` and authenticate with their sk_live key — so
 * auth + rate limiting happen here and the real MIMO_API_KEY never leaves the
 * server. We validate the body (model allowlist, token clamp, size cap) before
 * forwarding so an authenticated client can't request arbitrarily expensive
 * completions. Streaming and non-streaming both pass through.
 */
proxyRoutes.post("/chat/completions", apiKeyAuth, rateLimiter, async (c) => {
  const raw = await c.req.text();
  if (raw.length > MAX_BODY_BYTES) {
    throw new BadRequestError("Request body too large");
  }

  let body: Record<string, unknown>;
  try {
    body = JSON.parse(raw) as Record<string, unknown>;
  } catch {
    throw new BadRequestError("Invalid JSON body");
  }

  // Model allowlist — only MiMo models are permitted via the proxy.
  if (typeof body.model !== "string" || !body.model.startsWith(MODEL_PREFIX)) {
    throw new BadRequestError(`Unsupported model. Only "${MODEL_PREFIX}*" models are allowed.`);
  }
  // Clamp output tokens to cap cost.
  if (typeof body.max_tokens === "number" && body.max_tokens > MAX_OUTPUT_TOKENS) {
    body.max_tokens = MAX_OUTPUT_TOKENS;
  }

  const upstream = await fetch(`${env.mimoBaseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.mimoApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  // Pass the upstream response straight through (handles SSE + JSON alike).
  return new Response(upstream.body, {
    status: upstream.status,
    headers: {
      "Content-Type": upstream.headers.get("Content-Type") ?? "application/json",
    },
  });
});
