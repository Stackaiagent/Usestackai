/**
 * Typed error classes shared across StackAI packages.
 * No generic `throw new Error()` — always use a typed class so callers
 * (API middleware, CLI) can branch on `instanceof`.
 */

export class StackAIError extends Error {
  override readonly name: string = "StackAIError";
  constructor(message: string) {
    super(message);
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

/** Raised by FileAgent when a path escapes the sandboxed cwd. */
export class PathEscapeError extends StackAIError {
  override readonly name = "PathEscapeError";
  constructor(public readonly attemptedPath: string) {
    super(`Path "${attemptedPath}" escapes the working directory`);
  }
}

/** Raised by FileAgent when an edit's `oldStr` is not found or ambiguous. */
export class EditError extends StackAIError {
  override readonly name = "EditError";
  constructor(message: string) {
    super(message);
  }
}

/** Raised by LLMClient when the upstream MiMo API returns an error. */
export class LLMError extends StackAIError {
  override readonly name = "LLMError";
  constructor(
    message: string,
    public readonly status?: number,
  ) {
    super(message);
  }
}

/** Raised by AgentRunner when the tool-call loop exceeds maxSteps. */
export class MaxStepsExceededError extends StackAIError {
  override readonly name = "MaxStepsExceededError";
  constructor(public readonly maxSteps: number) {
    super(`Agent exceeded the maximum of ${maxSteps} steps without finishing`);
  }
}
