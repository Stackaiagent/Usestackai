import { randomUUID } from "node:crypto";
import { createMiddleware } from "hono/factory";
import type { AppVariables } from "../types.js";

/** Assigns a request id and logs method, path, status, and duration. */
export const requestLogger = createMiddleware<{ Variables: AppVariables }>(
  async (c, next) => {
    const requestId = randomUUID();
    c.set("requestId", requestId);
    const start = Date.now();

    await next();

    const ms = Date.now() - start;
    console.log(
      `[${requestId}] ${c.req.method} ${c.req.path} → ${c.res.status} (${ms}ms)`,
    );
  },
);
