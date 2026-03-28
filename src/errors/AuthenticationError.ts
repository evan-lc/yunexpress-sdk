import { YunExpressError, type YunExpressErrorOptions } from "./YunExpressError.ts";

export class AuthenticationError extends YunExpressError {
  constructor(message: string, options: YunExpressErrorOptions = {}) {
    super(message, options);
  }
}
