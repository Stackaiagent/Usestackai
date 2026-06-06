import OpenAI from "openai";
import type {
  ChatCompletionMessageParam,
  ChatCompletionMessageToolCall,
  ChatCompletionTool,
} from "openai/resources/chat/completions";
import { LLMError } from "./errors.js";
import type { OnChunk } from "./types.js";

/** Result of a streaming tool-aware completion. */
export interface StreamChatResult {
  content: string;
  toolCalls: ChatCompletionMessageToolCall[];
  finishReason: string | null;
}

const DEFAULT_BASE_URL = "https://token-plan-sgp.xiaomimimo.com/v1";
const DEFAULT_MODEL = "mimo-v2.5-pro";

export interface LLMClientOptions {
  apiKey: string;
  /** Defaults to Xiaomi MiMo's OpenAI-compatible endpoint. */
  baseURL?: string;
  /** Defaults to `mimo-v2.5-pro`. */
  model?: string;
}

export interface ChatOptions {
  tools?: ChatCompletionTool[];
  temperature?: number;
}

/**
 * Thin wrapper around the OpenAI SDK pointed at Xiaomi MiMo's
 * OpenAI-compatible endpoint. Used by AgentRunner and the API server.
 */
export class LLMClient {
  private readonly client: OpenAI;
  readonly model: string;

  constructor(options: LLMClientOptions) {
    if (!options.apiKey) {
      throw new LLMError("LLMClient requires an apiKey (MIMO_API_KEY)");
    }
    this.model = options.model ?? DEFAULT_MODEL;
    this.client = new OpenAI({
      apiKey: options.apiKey,
      baseURL: options.baseURL ?? DEFAULT_BASE_URL,
    });
  }

  /** Single non-streaming completion. Returns the raw message (may hold tool_calls). */
  async chat(
    messages: ChatCompletionMessageParam[],
    options: ChatOptions = {},
  ): Promise<OpenAI.Chat.Completions.ChatCompletion.Choice> {
    try {
      const response = await this.client.chat.completions.create({
        model: this.model,
        messages,
        temperature: options.temperature ?? 0.2,
        ...(options.tools ? { tools: options.tools } : {}),
      });
      const choice = response.choices[0];
      if (!choice) {
        throw new LLMError("MiMo returned no choices");
      }
      return choice;
    } catch (err) {
      throw toLLMError(err);
    }
  }

  /**
   * Streaming tool-aware completion. Streams content tokens via `onToken`
   * while reconstructing any tool_calls from their deltas. Resolves once the
   * stream ends with the full content, the assembled tool calls, and the
   * finish reason. Used by AgentRunner so the agent can stream its prose.
   */
  async streamChat(
    messages: ChatCompletionMessageParam[],
    options: ChatOptions & { onToken?: (token: string) => void } = {},
  ): Promise<StreamChatResult> {
    let content = "";
    const acc = new Map<
      number,
      { id: string; name: string; args: string }
    >();
    let finishReason: string | null = null;

    try {
      const stream = await this.client.chat.completions.create({
        model: this.model,
        messages,
        temperature: options.temperature ?? 0,
        stream: true,
        ...(options.tools ? { tools: options.tools } : {}),
      });

      for await (const part of stream) {
        const choice = part.choices[0];
        if (!choice) continue;
        const delta = choice.delta;

        if (delta?.content) {
          content += delta.content;
          options.onToken?.(delta.content);
        }
        for (const tc of delta?.tool_calls ?? []) {
          const idx = tc.index;
          let entry = acc.get(idx);
          if (!entry) {
            entry = { id: "", name: "", args: "" };
            acc.set(idx, entry);
          }
          if (tc.id) entry.id = tc.id;
          if (tc.function?.name) entry.name = tc.function.name;
          if (tc.function?.arguments) entry.args += tc.function.arguments;
        }
        if (choice.finish_reason) finishReason = choice.finish_reason;
      }
    } catch (err) {
      throw toLLMError(err);
    }

    const toolCalls: ChatCompletionMessageToolCall[] = [...acc.entries()]
      .sort(([a], [b]) => a - b)
      // Drop incomplete tool calls — an empty id/name would produce a
      // malformed history (tool_call_id "") and 400 the next request.
      .filter(([, v]) => v.id && v.name)
      .map(([, v]) => ({
        id: v.id,
        type: "function",
        function: { name: v.name, arguments: v.args },
      }));

    return { content, toolCalls, finishReason };
  }

  /**
   * Streaming completion. Invokes `onChunk` for every content delta and
   * resolves with the fully concatenated text once the stream ends.
   */
  async stream(
    messages: ChatCompletionMessageParam[],
    onChunk: OnChunk,
    options: ChatOptions = {},
  ): Promise<string> {
    let full = "";
    try {
      const stream = await this.client.chat.completions.create({
        model: this.model,
        messages,
        temperature: options.temperature ?? 0.2,
        stream: true,
        ...(options.tools ? { tools: options.tools } : {}),
      });
      for await (const part of stream) {
        const delta = part.choices[0]?.delta?.content;
        if (delta) {
          full += delta;
          onChunk(delta);
        }
      }
    } catch (err) {
      throw toLLMError(err);
    }
    return full;
  }
}

function toLLMError(err: unknown): LLMError {
  if (err instanceof LLMError) return err;
  if (err instanceof OpenAI.APIError) {
    return new LLMError(err.message, err.status);
  }
  const message = err instanceof Error ? err.message : String(err);
  return new LLMError(message);
}
