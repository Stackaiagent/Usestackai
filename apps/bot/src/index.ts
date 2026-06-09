import os from "node:os";
import http from "node:http";
import path from "node:path";
import { promises as fs } from "node:fs";
import { fileURLToPath } from "node:url";
import { randomBytes } from "node:crypto";
import { Bot } from "grammy";
import {
  LLMClient,
  AgentRunner,
  SkillRegistry,
  type AgentStep,
} from "@stackai/core";
import { getUserByTelegramId, createLinkCode } from "./supabase.js";

function required(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
}

const TOKEN = required("TELEGRAM_BOT_TOKEN");
const MIMO_API_KEY = required("MIMO_API_KEY");
const WEB_URL = process.env.WEB_URL ?? "https://usestackai.com";

// Built-in skills: dist/skills in prod (copied by tsup), or packages/skills in
// dev (tsx). load() skips dirs that don't exist, so we pass both candidates.
const HERE = path.dirname(fileURLToPath(import.meta.url));
const SKILL_DIRS = [
  path.join(HERE, "skills"), // prod: apps/bot/dist/skills
  path.resolve(HERE, "../../../packages/skills"), // dev: from apps/bot/src
];
// Empty working dir for the agent's file tools (skills don't write here).
const WORK_DIR = path.join(os.tmpdir(), "stackai-bot");

const WELCOME = [
  "🤖 *StackAI* — your crypto AI agent on Telegram.",
  "",
  "First, link your account: /link",
  "",
  "Then just ask, e.g.:",
  '• "is 0x… safe?"  (rug / honeypot check)',
  '• "what\'s trending on base?"',
  '• "price of 0x…?"',
  '• "defi tvl on base?"',
].join("\n");

// MVP per-user daily rate limit (in-memory; resets on restart).
const DAILY_LIMIT = 30;
const hits = new Map<string, { day: string; n: number }>();
function allow(id: string): boolean {
  const day = new Date().toISOString().slice(0, 10);
  const cur = hits.get(id);
  if (!cur || cur.day !== day) {
    hits.set(id, { day, n: 1 });
    return true;
  }
  if (cur.n >= DAILY_LIMIT) return false;
  cur.n += 1;
  return true;
}

/**
 * Server-side command gate: only allow the agent to run a bundled skill script
 * (`node "<path inside SKILLS_DIR>.mjs" …`). Everything else is denied so the
 * model can never run arbitrary shell commands on the server.
 */
const skillBases = SKILL_DIRS.map((d) => path.resolve(d));
function confirm(command: string): boolean {
  const m =
    /^node\s+"([^"]+\.mjs)"/i.exec(command) ??
    /^node\s+(\S+\.mjs)/i.exec(command);
  if (!m?.[1]) return false;
  const script = path.resolve(m[1]);
  return skillBases.some((base) => script.startsWith(base));
}

async function main(): Promise<void> {
  await fs.mkdir(WORK_DIR, { recursive: true });

  const skills = new SkillRegistry();
  // Telegram stays READ-ONLY: skills that move funds (onchain_writes) are not
  // loaded here. Trading/launch lives in the CLI where the user holds the key.
  await skills.load(SKILL_DIRS, { excludeCapabilities: ["onchain_writes"] });
  console.log(`[bot] loaded ${skills.size} read-only skill(s)`);

  const TELEGRAM_STYLE = [
    "You are replying inside a Telegram chat. Format for chat, NOT for a document:",
    "- Plain text only. Do NOT use markdown tables, ### headings, bold/italic syntax, or horizontal rules (---) — they render as literal junk here.",
    "- Be short and scannable: lead with the answer, short lines, at most a few simple bullets like •.",
    "- Don't list all your capabilities unless asked. For a greeting, reply in one or two lines and invite a question.",
    "- Reply in the same language the user wrote in.",
  ].join("\n");

  const llm = new LLMClient({ apiKey: MIMO_API_KEY });
  const runner = new AgentRunner({
    llm,
    skills,
    maxSteps: 12,
    systemExtra: TELEGRAM_STYLE,
  });

  const bot = new Bot(TOKEN);

  bot.command(["start", "help"], (ctx) =>
    ctx.reply(WELCOME, { parse_mode: "Markdown" }),
  );

  bot.command("link", async (ctx) => {
    const tgId = ctx.from ? String(ctx.from.id) : null;
    if (!tgId) return;
    const code = randomBytes(8).toString("hex");
    await createLinkCode(code, tgId, ctx.from?.username ?? null);
    await ctx.reply(
      `Link your StackAI account:\n${WEB_URL}/link?code=${code}\n\n` +
        "Open it, sign in with X, and tap Connect. The code expires in 15 minutes.",
    );
  });

  bot.on("message:text", async (ctx) => {
    const text = ctx.message.text;
    if (text.startsWith("/")) return; // unknown command — ignore
    const tgId = String(ctx.from.id);

    const user = await getUserByTelegramId(tgId);
    if (!user) {
      await ctx.reply("You're not linked yet. Send /link to connect your StackAI account first.");
      return;
    }
    if (!allow(tgId)) {
      await ctx.reply(`Daily limit reached (${DAILY_LIMIT}/day). Try again tomorrow.`);
      return;
    }

    const thinking = await ctx.reply("🤔 working…");
    let summary = "";
    let lastDetail = "";
    const onStep = (s: AgentStep) => {
      if (s.type === "done") summary = s.summary;
      else if (s.type === "tool_result" && s.ok) lastDetail = s.detail;
    };

    try {
      const res = await runner.run({
        prompt: text,
        cwd: WORK_DIR,
        onStep,
        confirm,
      });
      let reply = (res.summary || summary || lastDetail || "Done.").trim();
      if (reply.length > 3900) reply = reply.slice(0, 3900) + "…";
      await ctx.api.editMessageText(
        thinking.chat.id,
        thinking.message_id,
        reply,
      );
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      await ctx.api.editMessageText(
        thinking.chat.id,
        thinking.message_id,
        `⚠️ ${msg}`,
      );
    }
  });

  bot.catch((err) => {
    console.error("[bot] error:", err.error);
  });

  // Minimal health server so Railway (which expects a bound port) keeps the
  // worker alive and we can curl it to confirm the bot is up.
  const port = Number(process.env.PORT) || 3000;
  http
    .createServer((_req, res) => {
      res.writeHead(200, { "content-type": "text/plain" });
      res.end("StackAI bot ok");
    })
    .listen(port, () => console.log(`[bot] health server on :${port}`));

  console.log("[bot] starting (long polling)…");
  await bot.start({
    onStart: (me) => console.log(`[bot] online as @${me.username}`),
  });
}

main().catch((err: unknown) => {
  console.error(err instanceof Error ? err.message : String(err));
  process.exit(1);
});
