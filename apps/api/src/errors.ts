import type { ContentfulStatusCode } from "hono/utils/http-status";

/** Base class for errors that map to an HTTP response. */
export class ApiError extends Error {
  override readonly name: string = "ApiError";
  constructor(
    message: string,
    public readonly status: ContentfulStatusCode,
  ) {
    super(message);
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class UnauthorizedError extends ApiError {
  override readonly name = "UnauthorizedError";
  constructor(message = "Invalid or missing API key") {
    super(message, 401);
  }
}

export class RateLimitError extends ApiError {
  override readonly name = "RateLimitError";
  constructor(
    public readonly limit: number,
    public readonly used: number,
  ) {
    super(`Daily rate limit of ${limit} requests exceeded`, 429);
  }
}

export class BadRequestError extends ApiError {
  override readonly name = "BadRequestError";
  constructor(message: string) {
    super(message, 400);
  }
}
