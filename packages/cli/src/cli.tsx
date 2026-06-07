import React from "react";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { render } from "ink";
import { LLMClient, AgentRunner, SkillRegistry } from "@stackai/core";
import { readConfig, writeConfig, clearConfig, setBankrKey, DEFAULT_API_URL } from "./config.js";
import { ApiClient } from "./api.js";
import { RunView } from "./ui/run-view.js";
import { Interactive } from "./ui/interactive.js";
import { LoginView } from "./ui/login-view.js";

const VERSION = "0.1.10";

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
    $ stackai bankr set <bk_key>   Save your Bankr API key (for the bankr skill)
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

  // skill — list available skills (built-in + ~/.stackai/skills). No auth needed.
  if (first === "skill") {
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
  const llm = new LLMClient({
    apiKey: config.apiKey,
    baseURL: `${config.apiUrl}/api/v1`,
  });
  const runner = new AgentRunner({
    llm,
    skills: await loadSkills(),
    env: config.bankrKey ? { BANKR_API_KEY: config.bankrKey } : undefined,
  });
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
      <Interactive session={runner.session(cwd)} cwd={cwd} version={VERSION} />,
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
