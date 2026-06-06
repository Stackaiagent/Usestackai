import { createHash, randomBytes } from "node:crypto";

const PREFIX = "sk_live_";

/** `sk_live_<16 hex chars>` */
export function generateApiKey(): string {
  return PREFIX + randomBytes(8).toString("hex");
}

export function hashApiKey(key: string): string {
  return createHash("sha256").update(key).digest("hex");
}

/** First 12 chars stored for display. */
export function keyPrefix(key: string): string {
  return key.slice(0, 12);
}

/** `sk_live_4a8f****` */
export function maskKey(prefix: string): string {
  return `${prefix}****`;
}
