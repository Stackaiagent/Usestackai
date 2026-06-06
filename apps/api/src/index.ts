import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { env } from "./env.js";
import { requestLogger } from "./middleware/request-logger.js";
import { ApiError } from "./errors.js";
import { authRoutes } from "./routes/auth.js";
import { agentRoutes } from "./routes/agent.js";
import { usageRoutes } from "./routes/usage.js";
import { proxyRoutes } from "./routes/proxy.js";
import type { AppVariables } from "./types.js";

const app = new Hono<{ Variables: AppVariables }>();

// CORS is for browser callers (the Vibe web page). The CLI isn't a browser, so
// locking origins doesn't affect it. Allow configured web origins; in dev,
// allow all so localhost works.
const allowedOrigins = env.webOrigins.length
  ? env.webOrigins
  : [
      "https://usestackai.com",
      "https://stack-ai-web-one.vercel.app",
      "http://localhost:3000",
    ];
app.use(
  "*",
  cors({
    origin: env.isDev ? "*" : allowedOrigins,
    allowMethods: ["GET", "POST", "OPTIONS"],
    allowHeaders: ["Authorization", "Content-Type"],
  }),
);
app.use("*", requestLogger);

app.get("/", (c) => c.json({ name: "StackAI API", status: "ok" }));

// Mounted under /api/* to match the CLI + web client paths.
app.route("/api", authRoutes); // POST /api/verify
app.route("/api", agentRoutes); // POST /api/vibe  (and /api/run, unused)
app.route("/api/usage", usageRoutes); // GET  /api/usage
app.route("/api/v1", proxyRoutes); // POST /api/v1/chat/completions

// Centralized error handling — typed ApiErrors map to their status.
app.onError((err, c) => {
  if (err instanceof ApiError) {
    return c.json({ error: err.name, message: err.message }, err.status);
  }
  console.error("Unhandled error:", err);
  return c.json({ error: "InternalServerError", message: "Unexpected error" }, 500);
});

serve({ fetch: app.fetch, port: env.port }, (info) => {
  console.log(`StackAI API listening on http://localhost:${info.port}`);
});
