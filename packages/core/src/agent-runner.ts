import type {
  ChatCompletionMessageParam,
  ChatCompletionTool,
  ChatCompletionMessageToolCall,
} from "openai/resources/chat/completions";
import { LLMClient } from "./llm-client.js";
import { FileAgent } from "./file-agent.js";
import { SkillRegistry } from "./skill-loader.js";
import { SYSTEM_PROMPT } from "./system-prompt.js";
import type { OnStep, ConfirmRun } from "./types.js";

/** Max characters of a tool result kept in conversation history. */
const MAX_TOOL_RESULT_CHARS = 12_000;

function clipResult(text: string): string {
  if (text.length <= MAX_TOOL_RESULT_CHARS) return text;
  return (
    text.slice(0, MAX_TOOL_RESULT_CHARS) +
    `\n… [truncated ${text.length - MAX_TOOL_RESULT_CHARS} chars]`
  );
}

export interface AgentRunnerOptions {
  llm: LLMClient;
  /** Hard ceiling on tool-call iterations. Defaults to 50. */
  maxSteps?: number;
  /** Optional skill registry — its index is injected and `load_skill` enabled. */
  skills?: SkillRegistry;
  /** Extra system instruction appended last (e.g. surface-specific formatting). */
  systemExtra?: string;
  /** Extra env vars injected into every run_command (e.g. BANKR_API_KEY). */
  env?: Record<string, string>;
}

export interface RunOptions {
  prompt: string;
  cwd: string;
  onStep?: OnStep;
  /** Approval gate for `run_command`. Without it, commands are never run. */
  confirm?: ConfirmRun;
}

export interface RunResult {
  summary: string;
  steps: number;
}

/** Max distinct tool calls executed per single model turn (anti-spam guard). */
const MAX_TOOL_CALLS_PER_TURN = 6;

/** The tool schema advertised to MiMo. Mirrors FileAgent's methods. */
const TOOLS: ChatCompletionTool[] = [
  {
    type: "function",
    function: {
      name: "read_file",
      description: "Read a UTF-8 file relative to the project root.",
      parameters: {
        type: "object",
        properties: { path: { type: "string" } },
        required: ["path"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "write_file",
      description: "Create or overwrite a file with the given content.",
      parameters: {
        type: "object",
        properties: {
          path: { type: "string" },
          content: { type: "string" },
        },
        required: ["path", "content"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "edit_file",
      description:
        "Replace the first (unique) occurrence of oldStr with newStr in a file.",
      parameters: {
        type: "object",
        properties: {
          path: { type: "string" },
          oldStr: { type: "string" },
          newStr: { type: "string" },
        },
        required: ["path", "oldStr", "newStr"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "list_files",
      description: "List files and directories at a path (default: project root).",
      parameters: {
        type: "object",
        properties: { dir: { type: "string" } },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "create_dir",
      description: "Create a directory (recursive).",
      parameters: {
        type: "object",
        properties: { path: { type: "string" } },
        required: ["path"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "search_files",
      description:
        "Search file contents across the project with a regular expression. Returns matching `path:line: text`.",
      parameters: {
        type: "object",
        properties: { pattern: { type: "string" } },
        required: ["pattern"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "find_files",
      description:
        "Find files by glob pattern (e.g. `src/**/*.ts`, `*.json`). Returns matching paths.",
      parameters: {
        type: "object",
        properties: { pattern: { type: "string" } },
        required: ["pattern"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "run_command",
      description:
        "Run a shell command in the project root (e.g. run tests, install deps, build, git). Returns stdout, stderr, and the exit code. The user must approve each command. Use non-interactive flags; run ONE command at a time.",
      parameters: {
        type: "object",
        properties: { command: { type: "string" } },
        required: ["command"],
      },
    },
  },
];

/** Advertised only when a SkillRegistry with at least one skill is present. */
const LOAD_SKILL_TOOL: ChatCompletionTool = {
  type: "function",
  function: {
    name: "load_skill",
    description:
      "Load the full runbook for a named skill from the skills index, then follow its instructions. Call this when the user's request matches an available skill.",
    parameters: {
      type: "object",
      properties: { name: { type: "string" } },
      required: ["name"],
    },
  },
};

/**
 * Main execution loop. Sends the prompt to MiMo, executes any requested file
 * tools, feeds the results back, and repeats until the model stops calling
 * tools (finish_reason: "stop") or maxSteps is hit.
 */
export class AgentRunner {
  private readonly llm: LLMClient;
  private readonly maxSteps: number;
  private readonly skills?: SkillRegistry;
  private readonly systemExtra?: string;
  private readonly env?: Record<string, string>;

  constructor(options: AgentRunnerOptions) {
    this.llm = options.llm;
    this.maxSteps = options.maxSteps ?? 50;
    this.skills = options.skills;
    this.systemExtra = options.systemExtra;
    this.env = options.env;
  }

  async run({ prompt, cwd, onStep, confirm }: RunOptions): Promise<RunResult> {
    const files = new FileAgent(cwd);
    const messages = await this.systemMessages(files);
    messages.push({ role: "user", content: prompt });
    return this.runLoop(messages, files, onStep, confirm);
  }

  /** Start a stateful chat session that retains history across prompts. */
  session(cwd: string): AgentSession {
    return new AgentSession(this, cwd);
  }

  /**
   * Build the leading system messages: the base system prompt plus any
   * project context found in STACKAI.md / AGENTS.md at the project root.
   * @internal
   */
  async systemMessages(
    files: FileAgent,
  ): Promise<ChatCompletionMessageParam[]> {
    const messages: ChatCompletionMessageParam[] = [
      { role: "system", content: SYSTEM_PROMPT },
    ];
    for (const name of ["STACKAI.md", "AGENTS.md"]) {
      try {
        const ctx = (await files.readFile(name)).trim();
        if (ctx) {
          messages.push({
            role: "system",
            content: `Project instructions from ${name}:\n\n${ctx}`,
          });
          break;
        }
      } catch {
        // file not present — ignore
      }
    }
    if (this.skills?.size) {
      messages.push({ role: "system", content: this.skills.indexForPrompt() });
    }
    if (this.systemExtra?.trim()) {
      messages.push({ role: "system", content: this.systemExtra.trim() });
    }
    return messages;
  }

  /**
   * Run the tool-call loop over an existing message history (mutated in place).
   * Shared by one-shot run() and the interactive AgentSession.
   * @internal
   */
  async runLoop(
    messages: ChatCompletionMessageParam[],
    files: FileAgent,
    onStep?: OnStep,
    confirm?: ConfirmRun,
  ): Promise<RunResult> {
    const tools = this.skills?.size ? [...TOOLS, LOAD_SKILL_TOOL] : TOOLS;
    for (let step = 1; step <= this.maxSteps; step++) {
      const { content, toolCalls } = await this.llm.streamChat(messages, {
        tools,
        temperature: 0,
        onToken: (text) => onStep?.({ type: "token", text }),
      });

      // Push the assistant turn (with any tool_calls) into history.
      messages.push({
        role: "assistant",
        content,
        ...(toolCalls.length ? { tool_calls: toolCalls } : {}),
      });

      // Done only when there are no tool calls to run. (Some backends report
      // finish_reason "stop" while still returning tool_calls — we must execute
      // them, or the history becomes malformed and the next request 400s.)
      if (toolCalls.length === 0) {
        const summary = content.trim() || "Done.";
        onStep?.({ type: "done", summary });
        return { summary, steps: step };
      }

      // Some models pack dozens of (often redundant) tool calls into one
      // response. We (a) dedupe identical (name + arguments) calls and
      // (b) cap how many distinct calls we actually execute per turn. Every
      // tool_call_id still gets a response (protocol requirement); overflow
      // calls get a notice that nudges the model to wrap up.
      const seen = new Map<string, string>();
      let executed = 0;
      for (const call of toolCalls) {
        const sig = `${call.function.name}:${call.function.arguments}`;
        let result = seen.get(sig);
        if (result === undefined) {
          if (executed >= MAX_TOOL_CALLS_PER_TURN) {
            result =
              "Skipped: too many tool calls in one turn. Apply one change at a time.";
          } else {
            result = await this.execTool(files, call, onStep, confirm);
            executed += 1;
          }
          seen.set(sig, result);
        }
        messages.push({
          role: "tool",
          tool_call_id: call.id,
          // Cap stored tool output so a big file read/search doesn't bloat
          // every subsequent request (keeps memory + payload bounded).
          content: clipResult(result),
        });
      }
    }

    // Hit the step ceiling — finish gracefully instead of throwing so the
    // user keeps the partial work and a clear message (not a crash/error).
    const summary = `Reached the ${this.maxSteps}-step limit — stopping here. Run again to continue from where it left off.`;
    onStep?.({ type: "done", summary });
    return { summary, steps: this.maxSteps };
  }

  private async execTool(
    files: FileAgent,
    call: ChatCompletionMessageToolCall,
    onStep?: OnStep,
    confirm?: ConfirmRun,
  ): Promise<string> {
    const name = call.function.name;
    let args: Record<string, unknown>;
    try {
      args = JSON.parse(call.function.arguments || "{}") as Record<
        string,
        unknown
      >;
    } catch {
      return `Error: arguments for ${name} were not valid JSON`;
    }

    onStep?.({ type: "tool_call", name, args });

    try {
      const detail = await this.dispatch(files, name, args, confirm);
      onStep?.({ type: "tool_result", name, ok: true, detail });
      return detail;
    } catch (err) {
      const detail = err instanceof Error ? err.message : String(err);
      onStep?.({ type: "tool_result", name, ok: false, detail });
      return `Error: ${detail}`;
    }
  }

  private async dispatch(
    files: FileAgent,
    name: string,
    args: Record<string, unknown>,
    confirm?: ConfirmRun,
  ): Promise<string> {
    switch (name) {
      case "read_file":
        return files.readFile(str(args.path));
      case "write_file":
        await files.writeFile(str(args.path), str(args.content));
        return `Wrote ${str(args.path)}`;
      case "edit_file":
        await files.editFile(str(args.path), str(args.oldStr), str(args.newStr));
        return `Edited ${str(args.path)}`;
      case "list_files": {
        const entries = await files.listFiles(
          typeof args.dir === "string" ? args.dir : ".",
        );
        return entries.join("\n") || "(empty)";
      }
      case "create_dir":
        await files.createDir(str(args.path));
        return `Created ${str(args.path)}`;
      case "search_files": {
        const matches = await files.grep(str(args.pattern));
        return matches.join("\n") || "(no matches)";
      }
      case "find_files": {
        const found = await files.glob(str(args.pattern));
        return found.join("\n") || "(no files matched)";
      }
      case "run_command": {
        const command = str(args.command);
        const approved = confirm ? await confirm(command) : false;
        if (!approved) {
          return "Command was not run — the user declined (or no approval handler is available). Do not retry it; continue without running it.";
        }
        const { stdout, stderr, exitCode } = await files.runCommand(command, {
          env: this.env,
        });
        const parts = [`$ ${command}`];
        if (stdout.trim()) parts.push(stdout.trimEnd());
        if (stderr.trim()) parts.push(stderr.trimEnd());
        parts.push(`[exit ${exitCode}]`);
        return parts.join("\n");
      }
      case "load_skill": {
        if (!this.skills) return "Error: no skills are available.";
        const skill = await this.skills.read(str(args.name));
        if (!skill) {
          const avail = this.skills.list().map((s) => s.name).join(", ");
          return `Error: no skill named "${str(args.name)}". Available: ${avail || "(none)"}`;
        }
        return skill.body;
      }
      default:
        return `Error: unknown tool ${name}`;
    }
  }
}

function str(value: unknown): string {
  if (typeof value !== "string") {
    throw new Error(`expected string argument, got ${typeof value}`);
  }
  return value;
}

/**
 * A stateful agent conversation bound to one working directory. Unlike a
 * one-shot run, the message history (and therefore context) persists across
 * successive send() calls — this is what powers the interactive REPL.
 */
export class AgentSession {
  private messages: ChatCompletionMessageParam[] = [];
  private readonly files: FileAgent;
  private initialized = false;

  constructor(
    private readonly runner: AgentRunner,
    cwd: string,
  ) {
    this.files = new FileAgent(cwd);
  }

  /** Send a user message; the agent acts with full prior context. */
  async send(
    prompt: string,
    onStep?: OnStep,
    confirm?: ConfirmRun,
  ): Promise<RunResult> {
    if (!this.initialized) {
      // Seed the system prompt + project context (STACKAI.md) once.
      this.messages = await this.runner.systemMessages(this.files);
      this.initialized = true;
    }
    this.messages.push({ role: "user", content: prompt });
    return this.runner.runLoop(this.messages, this.files, onStep, confirm);
  }
}
