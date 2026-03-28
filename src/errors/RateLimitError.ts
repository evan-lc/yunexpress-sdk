import { YunExpressError, type YunExpressErrorOptions } from "./YunExpressError.ts";

export class RateLimitError extends YunExpressError {
  readonly retryAfter?: number;

  constructor(message: string, options: YunExpressErrorOptions & { retryAfter?: number } = {}) {
    super(message, options);
    this.retryAfter = options.retryAfter;
  }
}
