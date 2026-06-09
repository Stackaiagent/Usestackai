import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";

export interface CliConfig {
  apiKey: string;
  apiUrl: string;
  /** Optional user-supplied Bankr API key (bk_…) for the bankr skill. */
  bankrKey?: string;
  /** Selected model id (e.g. "mimo", "claude", or "openrouter:<id>"). Default: mimo. */
  model?: string;
  /** BYOK keys per model provider, e.g. { openrouter, venice, openai, xai, google }. */
  keys?: Record<string, string>;
  /** @deprecated legacy single Venice key — migrated into keys.venice. */
  veniceKey?: string;
}

// env var → provider name, so users can also pass keys via the environment.
const KEY_ENV: Record<string, string> = {
  OPENROUTER_API_KEY: "openrouter",
  VENICE_API_KEY: "venice",
  OPENAI_API_KEY: "openai",
  XAI_API_KEY: "xai",
  GEMINI_API_KEY: "google",
};

// The API runs on a persistent backend (Railway). Override per-machine with
// STACKAI_API_URL or `stackai auth <key> <url>`.
const DEFAULT_API_URL = "https://stackaiapi-production.up.railway.app";
const CONFIG_DIR = path.join(os.homedir(), ".stackai");
const CONFIG_PATH = path.join(CONFIG_DIR, "config.json");

export async function readConfig(): Promise<CliConfig | null> {
  try {
    const raw = await fs.readFile(CONFIG_PATH, "utf8");
    const parsed = JSON.parse(raw) as Partial<CliConfig>;
    if (!parsed.apiKey) return null;
    // Build the per-provider key map: stored keys.* + legacy veniceKey + env.
    const keys: Record<string, string> = { ...(parsed.keys ?? {}) };
    if (parsed.veniceKey && !keys.venice) keys.venice = parsed.veniceKey;
    for (const [env, provider] of Object.entries(KEY_ENV)) {
      const v = process.env[env];
      if (v) keys[provider] = v;
    }
    return {
      apiKey: parsed.apiKey,
      // STACKAI_API_URL env always wins — handy for pointing at a local API.
      apiUrl: process.env.STACKAI_API_URL ?? parsed.apiUrl ?? DEFAULT_API_URL,
      bankrKey: process.env.BANKR_API_KEY ?? parsed.bankrKey,
      model: parsed.model,
      keys,
    };
  } catch {
    return null;
  }
}

/** Merge a patch into the config file (a null value deletes that field). */
async function mergeConfig(patch: Record<string, unknown>): Promise<void> {
  let raw: Record<string, unknown> = {};
  try {
    raw = JSON.parse(await fs.readFile(CONFIG_PATH, "utf8")) as Record<
      string,
      unknown
    >;
  } catch {
    // no config yet — start fresh
  }
  for (const [k, v] of Object.entries(patch)) {
    if (v === null) delete raw[k];
    else raw[k] = v;
  }
  await fs.mkdir(CONFIG_DIR, { recursive: true });
  await fs.writeFile(CONFIG_PATH, JSON.stringify(raw, null, 2), "utf8");
}

export const setBankrKey = (key: string | null) => mergeConfig({ bankrKey: key });
export const setModel = (model: string | null) => mergeConfig({ model });

/** Set (or clear, with null) a provider's BYOK key in config.keys. */
export async function setKey(
  provider: string,
  key: string | null,
): Promise<void> {
  let raw: Record<string, unknown> = {};
  try {
    raw = JSON.parse(await fs.readFile(CONFIG_PATH, "utf8")) as Record<
      string,
      unknown
    >;
  } catch {
    // no config yet
  }
  const keys = (raw.keys as Record<string, string> | undefined) ?? {};
  if (key) keys[provider] = key;
  else delete keys[provider];
  raw.keys = keys;
  if (provider === "venice") delete raw.veniceKey; // drop the legacy field
  await fs.mkdir(CONFIG_DIR, { recursive: true });
  await fs.writeFile(CONFIG_PATH, JSON.stringify(raw, null, 2), "utf8");
}

export async function writeConfig(config: CliConfig): Promise<void> {
  await fs.mkdir(CONFIG_DIR, { recursive: true });
  await fs.writeFile(CONFIG_PATH, JSON.stringify(config, null, 2), "utf8");
}

export async function clearConfig(): Promise<void> {
  await fs.rm(CONFIG_PATH, { force: true });
}

export { DEFAULT_API_URL, CONFIG_PATH };
