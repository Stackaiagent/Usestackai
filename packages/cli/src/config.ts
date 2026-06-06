import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";

export interface CliConfig {
  apiKey: string;
  apiUrl: string;
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
    };
  } catch {
    return null;
  }
}

export async function writeConfig(config: CliConfig): Promise<void> {
  await fs.mkdir(CONFIG_DIR, { recursive: true });
  await fs.writeFile(CONFIG_PATH, JSON.stringify(config, null, 2), "utf8");
}

export async function clearConfig(): Promise<void> {
  await fs.rm(CONFIG_PATH, { force: true });
}

export { DEFAULT_API_URL, CONFIG_PATH };
