import { YunExpressError, type YunExpressErrorOptions } from "./YunExpressError.ts";

export class UpstreamApiError extends YunExpressError {
  constructor(message: string, options: YunExpressErrorOptions = {}) {
    super(message, options);
  }
}
