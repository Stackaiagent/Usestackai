import { LLMClient } from "@stackai/core";
import { env } from "./env.js";

/** Shared MiMo client for the API server. */
export const llm = new LLMClient({ apiKey: env.mimoApiKey });
