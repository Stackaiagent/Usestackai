import type { GeneratedFile } from "@stackai/core";
import { llm } from "../llm.js";

const VIBE_SYSTEM = `You are StackAI's Vibecoding assistant. You chat with the user AND build/iterate small, runnable static web projects (HTML/CSS/JS).

Decide from the latest user message:
- Greeting, a question, asking for ideas/recommendations, or an unclear request → reply conversationally. Suggest ideas or ask what they'd like to build. Do NOT output files.
- A concrete request to build, create, or change something → write a short reply, then output the full project files.

FORMAT — follow EXACTLY:
1. Start with a SHORT friendly reply (1-3 sentences). NEVER put code in the reply.
2. Then, ONLY when building or changing the project, output every file using this exact delimiter format (no markdown code fences):

===FILE: index.html===
<full file content>
===ENDFILE===

===FILE: styles.css===
<full file content>
===ENDFILE===

Rules when outputting files:
- Output EVERY file needed to run (not just changed ones). Always include an index.html entry point.
- Relative paths, no leading slash. Self-contained, working code. Prefer a single index.html.
- When modifying an existing project, preserve what works and apply only the requested change.
- Do NOT wrap file content in \`\`\` fences. Do NOT repeat the code in the reply.
When just chatting, output ONLY the reply (no ===FILE=== blocks).`;

export interface VibeChatMessage {
  role: "user" | "assistant";
  text: string;
}

export interface VibeResult {
  reply: string;
  files: GeneratedFile[] | null;
}

/**
 * Chat + build. Replies conversationally and only returns files when the user
 * asks to build/change something. `files` is the current project (iteration);
 * `history` is the prior conversation (context).
 */
export async function generateVibeProject(
  prompt: string,
  files?: GeneratedFile[],
  history?: VibeChatMessage[],
): Promise<VibeResult> {
  const messages: { role: "system" | "user" | "assistant"; content: string }[] =
    [{ role: "system", content: VIBE_SYSTEM }];

  for (const h of (history ?? []).slice(-8)) {
    messages.push({ role: h.role, content: h.text });
  }

  if (files && files.length > 0) {
    messages.push({
      role: "user",
      content:
        "Current project files:\n" +
        files.map((f) => `===FILE: ${f.path}===\n${f.content}\n===ENDFILE===`).join("\n\n"),
    });
  }

  messages.push({ role: "user", content: prompt });

  const choice = await llm.chat(messages, { temperature: 0.6 });
  return parseVibeResponse(choice.message.content ?? "");
}

const FILE_RE = /===FILE:\s*(.+?)\s*===\r?\n([\s\S]*?)\r?\n?===ENDFILE===/g;

/**
 * Normalize a model-supplied path into a safe relative path: strip Windows
 * drive letters, backslashes, leading slashes, and any `.`/`..` segments so a
 * generated file can never escape its folder when extracted/zipped on a client.
 */
function safePath(p: string): string {
  return p
    .trim()
    .replace(/\\/g, "/")
    .replace(/^[a-zA-Z]:/, "")
    .split("/")
    .filter((seg) => seg && seg !== "." && seg !== "..")
    .join("/");
}

/** Extract files via delimiters; the text before the first file block is the reply. */
function parseVibeResponse(raw: string): VibeResult {
  const text = raw.trim();
  const files: GeneratedFile[] = [];
  let firstIdx = -1;
  let m: RegExpExecArray | null;
  FILE_RE.lastIndex = 0;
  while ((m = FILE_RE.exec(text)) !== null) {
    if (firstIdx === -1) firstIdx = m.index;
    const path = safePath(m[1]!);
    if (path) files.push({ path, content: m[2]! });
  }

  let reply = (firstIdx === -1 ? text : text.slice(0, firstIdx)).trim();
  // Strip any accidental leading code fence the model might add.
  reply = reply.replace(/```[a-z]*\s*$/i, "").trim();
  if (!reply) reply = files.length ? "Here you go!" : text || "Done.";

  return { reply, files: files.length ? files : null };
}
