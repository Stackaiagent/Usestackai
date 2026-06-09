import React from "react";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { render } from "ink";
import { LLMClient, AgentRunner, SkillRegistry } from "@stackai/core";
import {
  readConfig,
  writeConfig,
  clearConfig,
  setBankrKey,
  setVeniceKey,
  setModel,
  DEFAULT_API_URL,
  type CliConfig,
} from "./config.js";
import { ApiClient } from "./api.js";
import { installSkill, removeSkill } from "./skill-install.js";

const VENICE_BASE_URL = "https://api.venice.ai/api/v1";

/**
 * Build the LLM for the chosen model. MiMo (default) goes through the StackAI
 * Railway proxy (free tier, rate-limited server-side). Any other id is a Venice
 * model called directly with the user's own Venice key (BYOK).
 */
function resolveLLM(config: CliConfig, modelId?: string): LLMClient {
  const id = modelId ?? config.model ?? "mimo";
  if (id === "mimo" || id === "mimo-v2.5-pro") {
    return new LLMClient({
      apiKey: config.apiKey,
      baseURL: `${config.apiUrl}/api/v1`,
    });
  }
  if (!config.veniceKey) {
    throw new Error("No Venice key set. Run: stackai venice set <key>");
  }
  return new LLMClient({
    apiKey: config.veniceKey,
    baseURL: VENICE_BASE_URL,
    model: id,
  });
}
import { RunView } from "./ui/run-view.js";
import { Interactive } from "./ui/interactive.js";
import { LoginView } from "./ui/login-view.js";

const VERSION = "0.1.13";

// Skills ship bundled next to the CLI (dist/skills) and users can install more
// into ~/.stackai/skills. User skills override built-ins on a name clash.
const BUILTIN_SKILLS_DIR = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  "skills",
);
const USER_SKILLS_DIR = path.join(os.homedir(), ".stackai", "skills");

async function loadSkills(): Promise<SkillRegistry> {
  const skills = new SkillRegistry();
  await skills.load([BUILTIN_SKILLS_DIR, USER_SKILLS_DIR]);
  return skills;
}

const HELP = `
  StackAI — AI coding agent in your terminal

  Usage
    $ stackai                      Start an interactive chat session
    $ stackai <prompt>             Run the agent once, then exit
    $ stackai login                Log in (prompts for your API key)
    $ stackai login <api_key>      Log in directly
    $ stackai whoami               Show current user + usage
    $ stackai skill                List available skills
    $ stackai skill add <repo> [p] Install a skill from a GitHub repo
    $ stackai skill remove <name>  Remove an installed skill
    $ stackai bankr set <bk_key>   Save your Bankr API key (for the bankr skill)
    $ stackai venice set <key>     Save a Venice API key (for Venice models)
    $ stackai venice models        List available Venice text models
    $ stackai model [id]           Show or set the default model (mimo or a Venice id)
    $ stackai logout               Remove your saved API key
    $ stackai --help
    $ stackai --version

  Advanced
    $ stackai auth <key> [url]     Save key with a custom API URL
`;

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const first = args[0];

  if (first === "--help" || first === "-h") {
    console.log(HELP);
    return;
  }
  if (first === "--version" || first === "-v") {
    console.log(VERSION);
    return;
  }

  // login — simple flow against the default (Railway) API.
  if (first === "login") {
    const key = args[1];
    if (key) {
      try {
        // Verify FIRST, then persist — never save an unverified/bad key.
        const verify = await new ApiClient({
          apiKey: key,
          apiUrl: DEFAULT_API_URL,
        }).verify();
        await writeConfig({ apiKey: key, apiUrl: DEFAULT_API_URL });
        console.log(
          `✓ Logged in as @${verify.user.username} · ${verify.user.tier} tier`,
        );
      } catch (err) {
        console.error(`✗ ${err instanceof Error ? err.message : String(err)}`);
        process.exitCode = 1;
      }
      return;
    }
    if (!process.stdin.isTTY) {
      console.error("Run: stackai login <api_key>");
      process.exitCode = 1;
      return;
    }
    render(<LoginView />);
    return;
  }

  if (first === "logout") {
    await clearConfig();
    console.log("✓ Logged out");
    return;
  }

  // bankr — manage the Bankr API key used by the bankr skill (BYOK).
  if (first === "bankr") {
    const sub = args[1];
    if (sub === "set") {
      const key = args[2];
      if (!key) {
        console.error("Usage: stackai bankr set <bk_...>");
        process.exitCode = 1;
        return;
      }
      await setBankrKey(key);
      console.log("✓ Bankr key saved. The bankr skill can now trade/launch on your behalf.");
      return;
    }
    if (sub === "clear") {
      await setBankrKey(null);
      console.log("✓ Bankr key removed.");
      return;
    }
    // status (default)
    const cfg = await readConfig();
    const k = cfg?.bankrKey;
    console.log(k ? `Bankr key: ${k.slice(0, 6)}…${k.slice(-4)} (set)` : "Bankr key: not set. Run: stackai bankr set <bk_...>");
    return;
  }

  // venice — manage the Venice API key + list Venice models (BYOK multi-model).
  if (first === "venice") {
    const sub = args[1];
    if (sub === "set") {
      const key = args[2];
      if (!key) {
        console.error("Usage: stackai venice set <key>");
        process.exitCode = 1;
        return;
      }
      await setVeniceKey(key);
      console.log("✓ Venice key saved. Switch with `stackai model <venice-id>` or /model in a session.");
      return;
    }
    if (sub === "clear") {
      await setVeniceKey(null);
      console.log("✓ Venice key removed.");
      return;
    }
    if (sub === "models") {
      const cfg = await readConfig();
      const key = cfg?.veniceKey;
      if (!key) {
        console.error("No Venice key. Run: stackai venice set <key>");
        process.exitCode = 1;
        return;
      }
      try {
        const res = await fetch(`${VENICE_BASE_URL}/models?type=text`, {
          headers: { Authorization: `Bearer ${key}` },
        });
        const json = (await res.json()) as { data?: { id: string }[] };
        const ids = (json.data ?? []).map((m) => m.id);
        console.log(ids.length ? ids.map((i) => `  ${i}`).join("\n") : "(no models returned)");
      } catch (err) {
        console.error(err instanceof Error ? err.message : String(err));
        process.exitCode = 1;
      }
      return;
    }
    console.error("Usage: stackai venice <set <key> | models | clear>");
    process.exitCode = 1;
    return;
  }

  // model — show or set the default model (persists for new sessions).
  if (first === "model") {
    const id = args[1];
    if (!id) {
      const cfg = await readConfig();
      console.log(`Default model: ${cfg?.model ?? "mimo"}`);
      console.log("Set with: stackai model <id>   (e.g. mimo, or a Venice model id)");
      return;
    }
    if (id !== "mimo") {
      const cfg = await readConfig();
      if (!cfg?.veniceKey) {
        console.error("That looks like a Venice model but no Venice key is set. Run: stackai venice set <key>");
        process.exitCode = 1;
        return;
      }
    }
    await setModel(id === "mimo" ? null : id);
    console.log(`✓ Default model set to ${id}.`);
    return;
  }

  // skill — list / install / remove skills (built-in + ~/.stackai/skills).
  if (first === "skill") {
    const sub = args[1];
    if (sub === "add") {
      const repo = args[2];
      const subpath = args[3];
      if (!repo) {
        console.error("Usage: stackai skill add <owner/repo> [path]");
        process.exitCode = 1;
        return;
      }
      try {
        console.log(`Installing from ${repo}${subpath ? "/" + subpath : ""}…`);
        const s = await installSkill(repo, subpath);
        console.log(`✓ Installed "${s.name}" (${s.files} files).`);
        console.log("⚠ Installed skills can run commands (with your approval). Only add skills you trust.");
      } catch (err) {
        console.error(`✗ ${err instanceof Error ? err.message : String(err)}`);
        process.exitCode = 1;
      }
      return;
    }
    if (sub === "remove") {
      const name = args[2];
      if (!name) {
        console.error("Usage: stackai skill remove <name>");
        process.exitCode = 1;
        return;
      }
      const ok = await removeSkill(name);
      console.log(ok ? `✓ Removed "${name}".` : `Skill "${name}" not found (built-ins can't be removed).`);
      return;
    }
    // list (default)
    const skills = await loadSkills();
    const items = skills.list();
    if (!items.length) {
      console.log("No skills installed.");
    } else {
      console.log(`Skills (${items.length}):`);
      for (const s of items) console.log(`  ${s.name} — ${s.description}`);
    }
    return;
  }

  // auth — advanced: save key with a custom API URL.
  if (first === "auth") {
    const key = args[1];
    if (!key) {
      console.error("Usage: stackai auth <api_key> [api_url]");
      process.exitCode = 1;
      return;
    }
    const apiUrl = args[2] ?? DEFAULT_API_URL;
    await writeConfig({ apiKey: key, apiUrl });
    console.log(`✓ API key saved to ~/.stackai/config.json (${apiUrl})`);
    return;
  }

  const config = await readConfig();
  if (!config) {
    console.error("Not logged in. Run: stackai login");
    process.exitCode = 1;
    return;
  }

  if (first === "whoami") {
    const api = new ApiClient(config);
    try {
      const [verify, usage] = await Promise.all([api.verify(), api.usage()]);
      const limit = usage.limit === null ? "∞" : usage.limit;
      console.log(`  @${verify.user.username} · ${usage.tier} tier`);
      console.log(`  Usage today: ${usage.used} / ${limit}`);
    } catch (err) {
      console.error(err instanceof Error ? err.message : String(err));
      process.exitCode = 1;
    }
    return;
  }

  // The agent loop runs locally; LLM calls are routed through the StackAI API
  // proxy (auth + rate limit server-side).
  let llm: LLMClient;
  try {
    llm = resolveLLM(config);
  } catch (err) {
    console.error(`${err instanceof Error ? err.message : err} — using mimo.`);
    llm = resolveLLM(config, "mimo");
  }
  const runner = new AgentRunner({
    llm,
    skills: await loadSkills(),
    env: config.bankrKey ? { BANKR_API_KEY: config.bankrKey } : undefined,
  });
  // Live model switch for the interactive /model command.
  const switchModel = async (id: string): Promise<string> => {
    try {
      runner.setLLM(resolveLLM(config, id));
      await setModel(id === "mimo" ? null : id);
      return `Switched to ${id}.`;
    } catch (err) {
      return err instanceof Error ? err.message : String(err);
    }
  };
  const currentModel = config.model ?? "mimo";
  const cwd = process.cwd();

  if (!first) {
    // No args → interactive chat session (history persists across prompts).
    if (!process.stdin.isTTY) {
      console.error(
        'Interactive mode needs a real terminal. Run a one-shot instead:\n  stackai "your prompt here"',
      );
      process.exitCode = 1;
      return;
    }
    render(
      <Interactive
        session={runner.session(cwd)}
        cwd={cwd}
        version={VERSION}
        model={currentModel}
        switchModel={switchModel}
      />,
    );
    return;
  }

  // Otherwise treat the args as a one-shot prompt.
  const prompt = args.join(" ");
  render(<RunView runner={runner} prompt={prompt} cwd={cwd} />);
}

// Fail clean, not with a raw stack trace, if anything escapes.
process.on("unhandledRejection", (reason) => {
  console.error(
    `\n${reason instanceof Error ? reason.message : String(reason)}`,
  );
  process.exit(1);
});
process.on("uncaughtException", (err) => {
  console.error(`\n${err instanceof Error ? err.message : String(err)}`);
  process.exit(1);
});

main().catch((err: unknown) => {
  console.error(err instanceof Error ? err.message : String(err));
  process.exitCode = 1;
});
