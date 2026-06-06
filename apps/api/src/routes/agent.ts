import { Hono } from "hono";
import { streamSSE } from "hono/streaming";
import { apiKeyAuth } from "../middleware/api-key-auth.js";
import { rateLimiter } from "../middleware/rate-limiter.js";
import { llm } from "../llm.js";
import { generateVibeProject, type VibeChatMessage } from "../services/vibe.js";
import { BadRequestError } from "../errors.js";
import type { GeneratedFile } from "@stackai/core";
import { env } from "../env.js";
import { getDb } from "../db.js";
import { SYSTEM_PROMPT } from "@stackai/core";
import type { AppVariables } from "../types.js";

export const agentRoutes = new Hono<{ Variables: AppVariables }>();

/**
 * POST /agent/run  { prompt: string }
 * Streams the agent's response token-by-token over SSE.
 */
agentRoutes.post("/run", apiKeyAuth, rateLimiter, async (c) => {
  const body = await c.req.json<{ prompt?: string; cwd?: string }>();
  const prompt = body.prompt?.trim();
  if (!prompt) {
    throw new BadRequestError("Missing 'prompt' in request body");
  }

  return streamSSE(c, async (stream) => {
    try {
      await llm.stream(
        [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: prompt },
        ],
        async (chunk) => {
          await stream.writeSSE({ event: "token", data: chunk });
        },
      );
      await stream.writeSSE({ event: "done", data: "[DONE]" });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      await stream.writeSSE({ event: "error", data: message });
    }
  });
});

/**
 * POST /agent/vibe  { prompt: string, save?: boolean, name?: string }
 * Generates project files. Optionally persists to vibe_projects.
 */
agentRoutes.post("/vibe", apiKeyAuth, rateLimiter, async (c) => {
  const body = await c.req.json<{
    prompt?: string;
    files?: GeneratedFile[];
    history?: VibeChatMessage[];
    save?: boolean;
    name?: string;
  }>();
  const prompt = body.prompt?.trim();
  if (!prompt) {
    throw new BadRequestError("Missing 'prompt' in request body");
  }

  const result = await generateVibeProject(prompt, body.files, body.history);

  if (body.save && env.hasSupabase && result.files) {
    const { user } = c.get("auth");
    await getDb().from("vibe_projects").insert({
      user_id: user.id,
      name: body.name ?? null,
      files: result.files,
    });
  }

  return c.json(result);
});
