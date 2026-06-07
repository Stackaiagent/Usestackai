/** Shared types for the agent system. */

export interface ChatMessage {
  role: "system" | "user" | "assistant" | "tool";
  content: string;
  /** Present on assistant messages that request tool calls. */
  tool_calls?: ToolCall[];
  /** Present on tool-result messages — links back to the call. */
  tool_call_id?: string;
}

export interface ToolCall {
  id: string;
  name: string;
  /** Raw JSON arguments string as returned by the model. */
  arguments: string;
}

/** A generated file returned by the vibe flow. */
export interface GeneratedFile {
  path: string;
  content: string;
}

/** A single step emitted by AgentRunner via the onStep callback. */
export type AgentStep =
  | { type: "token"; text: string }
  | { type: "tool_call"; name: string; args: Record<string, unknown> }
  | { type: "tool_result"; name: string; ok: boolean; detail: string }
  | { type: "done"; summary: string };

export type StreamChunk = string;
export type OnChunk = (chunk: StreamChunk) => void;
export type OnStep = (step: AgentStep) => void;

/**
 * Approval gate for shell commands. Called before `run_command` executes; if it
 * resolves false (or is absent) the command is NOT run. The CLI wires this to an
 * interactive y/n prompt; server-side callers leave it unset so commands can
 * never run without an explicit handler.
 */
export type ConfirmRun = (command: string) => boolean | Promise<boolean>;
