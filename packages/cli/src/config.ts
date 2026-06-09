import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";

export interface CliConfig {
  apiKey: string;
  apiUrl: string;
  /** Optional user-supplied Bankr API key (bk_…) for the bankr skill. */
  bankrKey?: string;
  /** Optional Venice API key (BYOK) for Venice models. */
  veniceKey?: string;
  /** Selected model id (e.g. "mimo" or a Venice model id). Default: mimo. */
  model?: string;
}

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
    return {
      apiKey: parsed.apiKey,
      // STACKAI_API_URL env always wins — handy for pointing at a local API.
      apiUrl: process.env.STACKAI_API_URL ?? parsed.apiUrl ?? DEFAULT_API_URL,
      // Env vars override stored keys.
      bankrKey: process.env.BANKR_API_KEY ?? parsed.bankrKey,
      veniceKey: process.env.VENICE_API_KEY ?? parsed.veniceKey,
      model: parsed.model,
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
export const setVeniceKey = (key: string | null) => mergeConfig({ veniceKey: key });
export const setModel = (model: string | null) => mergeConfig({ model });

export async function writeConfig(config: CliConfig): Promise<void> {
  await fs.mkdir(CONFIG_DIR, { recursive: true });
  await fs.writeFile(CONFIG_PATH, JSON.stringify(config, null, 2), "utf8");
}

export async function clearConfig(): Promise<void> {
  await fs.rm(CONFIG_PATH, { force: true });
}

export { DEFAULT_API_URL, CONFIG_PATH };
