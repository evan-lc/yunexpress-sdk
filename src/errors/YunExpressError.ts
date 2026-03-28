export interface YunExpressErrorOptions {
  code?: number | string;
  status?: number;
  headers?: Record<string, string>;
  body?: unknown;
  requestId?: string;
  cause?: unknown;
}

export class YunExpressError extends Error {
  readonly code?: number | string;
  readonly status?: number;
  readonly headers?: Record<string, string>;
  readonly body?: unknown;
  readonly requestId?: string;

  constructor(message: string, options: YunExpressErrorOptions = {}) {
    super(message, { cause: options.cause });
    this.name = new.target.name;
    this.code = options.code;
    this.status = options.status;
    this.headers = options.headers;
    this.body = options.body;
    this.requestId = options.requestId;
  }
}
