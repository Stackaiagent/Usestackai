import type { AuthContext } from "./db.js";

/** Hono context variables set by middleware. */
export interface AppVariables {
  auth: AuthContext;
  requestId: string;
}
