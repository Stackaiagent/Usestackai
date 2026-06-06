import { createHash, randomBytes } from "node:crypto";

const PREFIX = "sk_live_";

/** Generate a new API key: `sk_live_<16 hex chars>`. */
export function generateApiKey(): string {
  return PREFIX + randomBytes(8).toString("hex");
}

/** sha256 hex of the raw key — this is what we store in the DB. */
export function hashApiKey(key: string): string {
  return createHash("sha256").update(key).digest("hex");
}

/** First 12 chars, stored for display (e.g. `sk_live_4a8f`). */
export function keyPrefix(key: string): string {
  return key.slice(0, 12);
}

/** Mask a prefix for display everywhere except creation: `sk_live_4a8f****`. */
export function maskKey(prefix: string): string {
  return `${prefix}****`;
}
