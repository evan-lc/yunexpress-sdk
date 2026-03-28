import type { AuthProvider } from "../auth/AuthProvider.ts";
import type { ApiEnvelope } from "../config/types.ts";
import type { YunExpressEnvironment, YunExpressLogger } from "../config/types.ts";
import {
  AuthenticationError,
  RateLimitError,
  RequestExecutionError,
  UpstreamApiError,
} from "../errors/index.ts";
import type { ApiEnvelopeParser } from "./responseParser.ts";

export type HttpMethod = "DELETE" | "GET" | "HEAD" | "OPTIONS" | "PATCH" | "POST" | "PUT";

export type FetchLike = (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;

export type QueryPrimitive = boolean | Date | number | string;
export type QueryParamValue = QueryPrimitive | null | undefined | readonly QueryPrimitive[];
export type QueryParams = Record<string, QueryParamValue>;

export interface RetryPolicy {
  maxAttempts: number;
  initialDelayMs: number;
  maxDelayMs: number;
  backoffMultiplier: number;
  retryableStatusCodes: readonly number[];
  retryableMethods: readonly HttpMethod[];
}

export type RetryPolicyInput = false | number | Partial<RetryPolicy>;

export const DEFAULT_RETRY_POLICY: RetryPolicy = {
  maxAttempts: 2,
  initialDelayMs: 250,
  maxDelayMs: 2_000,
  backoffMultiplier: 2,
  retryableStatusCodes: [408, 425, 429, 500, 502, 503, 504],
  retryableMethods: ["DELETE", "GET", "HEAD", "OPTIONS", "PUT"],
};

export interface TransportRequestOptions {
  query?: QueryParams;
  headers?: Record<string, string>;
  timeoutMs?: number;
  retries?: RetryPolicyInput;
  idempotencyKey?: string;
  signal?: AbortSignal;
}

export interface TransportRequest<TBody = unknown> extends TransportRequestOptions {
  method: HttpMethod;
  path: string;
  body?: TBody;
}

export interface TransportRequestContext<TBody = unknown> extends TransportRequestOptions {
  method: HttpMethod;
  path: string;
  body?: TBody;
}

export interface PreparedRequest {
  method: HttpMethod;
  url: string;
  headers: Record<string, string>;
  bodyText?: BodyInit;
  attempt: number;
}

export interface TransportResponse<T> {
  ok: boolean;
  status: number;
  headers: Record<string, string>;
  requestId?: string;
  envelope: ApiEnvelope<T>;
  data: T;
  rawBody: unknown;
  rawResponse: Response;
}

export type RequestInterceptor = (
  request: PreparedRequest,
) => Promise<PreparedRequest> | PreparedRequest;

export type ResponseInterceptor = (
  response: TransportResponse<unknown>,
) => Promise<TransportResponse<unknown>> | TransportResponse<unknown>;

export interface TransportDependencies {
  environment: YunExpressEnvironment;
  baseUrl: string;
  timeoutMs: number;
  retries: RetryPolicy;
  authProvider: AuthProvider;
  fetch: FetchLike;
  headers: Record<string, string>;
  responseParser: ApiEnvelopeParser;
  logger?: YunExpressLogger;
  debug: boolean;
  requestInterceptors: RequestInterceptor[];
  responseInterceptors: ResponseInterceptor[];
}

export class YunExpressTransport {
  constructor(private readonly options: TransportDependencies) {}

  async execute<TResponse, TBody = unknown>(
    request: TransportRequest<TBody>,
  ): Promise<TransportResponse<TResponse>> {
    const url = buildUrl(this.options.baseUrl, request.path, request.query);
    const retryPolicy = normalizeRetryPolicy(request.retries, this.options.retries);
    const bodyText = serializeRequestBody(request.body);
    let lastError: unknown;

    for (let attempt = 1; attempt <= retryPolicy.maxAttempts; attempt += 1) {
      try {
        const preparedRequest = await this.prepareRequest({
          request,
          url,
          bodyText,
          attempt,
        });

        const response = await this.performRequest<TBody, TResponse>({
          request,
          preparedRequest,
        });

        if (!response.ok && shouldRetry({ request, response, retryPolicy, attempt })) {
          await waitForDelay(delayForAttempt(retryPolicy, attempt));
          continue;
        }

        if (!response.ok) {
          throw toResponseError(response);
        }

        return response;
      } catch (error) {
        lastError = error;

        if (
          !(error instanceof RequestExecutionError) ||
          !shouldRetry({ request, retryPolicy, attempt })
        ) {
          throw error;
        }

        await waitForDelay(delayForAttempt(retryPolicy, attempt));
      }
    }

    throw lastError ?? new RequestExecutionError("Request failed.");
  }

  private async prepareRequest<TBody>({
    request,
    url,
    bodyText,
    attempt,
  }: {
    request: TransportRequest<TBody>;
    url: string;
    bodyText?: BodyInit;
    attempt: number;
  }): Promise<PreparedRequest> {
    const headers = mergeHeaders(
      { accept: "application/json" },
      this.options.headers,
      request.headers,
    );

    if (bodyText && !headers["content-type"] && isJsonBody(bodyText)) {
      headers["content-type"] = "application/json";
    }

    if (request.idempotencyKey) {
      headers["idempotency-key"] = request.idempotencyKey;
    }

    const authHeaders = await this.options.authProvider.getHeaders({
      environment: this.options.environment,
      method: request.method,
      path: normalizePath(request.path),
      url,
      queryString: new URL(url).search,
      bodyText: typeof bodyText === "string" ? bodyText : undefined,
      headers,
    });

    let preparedRequest: PreparedRequest = {
      method: request.method,
      url,
      headers: mergeHeaders(headers, authHeaders),
      bodyText,
      attempt,
    };

    for (const interceptor of this.options.requestInterceptors) {
      preparedRequest = await interceptor(preparedRequest);
    }

    return preparedRequest;
  }

  private async performRequest<TBody, TResponse>({
    request,
    preparedRequest,
  }: {
    request: TransportRequest<TBody>;
    preparedRequest: PreparedRequest;
  }): Promise<TransportResponse<TResponse>> {
    const timeoutMs = request.timeoutMs ?? this.options.timeoutMs;
    const { cleanup, didTimeout, signal } = createRequestSignal(timeoutMs, request.signal);

    this.log("debug", "Dispatching YunExpress request", {
      method: preparedRequest.method,
      url: preparedRequest.url,
      attempt: preparedRequest.attempt,
    });

    let response: Response;

    try {
      response = await this.options.fetch(preparedRequest.url, {
        method: preparedRequest.method,
        headers: preparedRequest.headers,
        body: preparedRequest.bodyText,
        signal,
      });
    } catch (error) {
      cleanup();

      const message = didTimeout()
        ? `Request timed out after ${timeoutMs}ms.`
        : "Request execution failed.";

      throw new RequestExecutionError(message, {
        code: didTimeout() ? "REQUEST_TIMEOUT" : "REQUEST_EXECUTION_FAILED",
        cause: error,
      });
    }

    cleanup();

    const rawResponse = response.clone();
    const rawBody = await parseResponseBody(response);
    const envelope = this.options.responseParser.parse<TResponse>(rawBody, rawResponse);

    let transportResponse: TransportResponse<unknown> = {
      ok: rawResponse.ok && envelope.success !== false,
      status: rawResponse.status,
      headers: headersToRecord(rawResponse.headers),
      requestId: envelope.requestId,
      envelope,
      data: envelope.result,
      rawBody,
      rawResponse,
    };

    for (const interceptor of this.options.responseInterceptors) {
      transportResponse = await interceptor(transportResponse);
    }

    this.log("debug", "Received YunExpress response", {
      method: preparedRequest.method,
      url: preparedRequest.url,
      status: transportResponse.status,
      requestId: transportResponse.requestId,
    });

    return transportResponse as TransportResponse<TResponse>;
  }

  private log(level: "debug" | "error" | "info" | "warn", message: string, context?: unknown) {
    if (level === "debug" && !this.options.debug) {
      return;
    }

    const logger = this.options.logger ?? console;
    logger[level]?.(message, context);
  }
}

export function normalizeRetryPolicy(
  input: RetryPolicyInput | undefined,
  fallback: RetryPolicy = DEFAULT_RETRY_POLICY,
): RetryPolicy {
  if (input === false) {
    return {
      ...fallback,
      maxAttempts: 1,
    };
  }

  if (typeof input === "number") {
    return {
      ...fallback,
      maxAttempts: Math.max(1, input),
    };
  }

  if (!input) {
    return { ...fallback };
  }

  return {
    ...fallback,
    ...input,
    retryableStatusCodes: input.retryableStatusCodes ?? fallback.retryableStatusCodes,
    retryableMethods: input.retryableMethods ?? fallback.retryableMethods,
  };
}

function buildUrl(baseUrl: string, path: string, query?: QueryParams): string {
  const url = new URL(normalizePath(path), normalizeBaseUrl(baseUrl));

  if (!query) {
    return url.toString();
  }

  for (const [key, value] of Object.entries(query)) {
    if (value === null || value === undefined) {
      continue;
    }

    const entries = Array.isArray(value) ? value : [value];
    for (const entry of entries) {
      url.searchParams.append(key, serializeQueryValue(entry));
    }
  }

  return url.toString();
}

function normalizeBaseUrl(baseUrl: string): string {
  return baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`;
}

function normalizePath(path: string): string {
  return path.startsWith("/") ? path : `/${path}`;
}

function serializeQueryValue(value: QueryPrimitive): string {
  return value instanceof Date ? value.toISOString() : String(value);
}

function serializeRequestBody(body: unknown): BodyInit | undefined {
  if (body === null || body === undefined) {
    return undefined;
  }

  if (typeof body === "string") {
    return body;
  }

  if (body instanceof URLSearchParams) {
    return body;
  }

  if (typeof Blob !== "undefined" && body instanceof Blob) {
    return body;
  }

  if (typeof FormData !== "undefined" && body instanceof FormData) {
    return body;
  }

  return JSON.stringify(body);
}

function isJsonBody(body: BodyInit): body is string {
  return typeof body === "string";
}

async function parseResponseBody(response: Response): Promise<unknown> {
  if (response.status === 204 || response.status === 205) {
    return undefined;
  }

  const text = await response.text();
  if (!text) {
    return undefined;
  }

  const contentType = response.headers.get("content-type") ?? "";
  if (contentType.includes("json")) {
    try {
      return JSON.parse(text) as unknown;
    } catch {
      return text;
    }
  }

  const trimmed = text.trim();
  if (
    (trimmed.startsWith("{") && trimmed.endsWith("}")) ||
    (trimmed.startsWith("[") && trimmed.endsWith("]"))
  ) {
    try {
      return JSON.parse(trimmed) as unknown;
    } catch {
      return text;
    }
  }

  return text;
}

function mergeHeaders(
  ...sources: Array<Record<string, string> | undefined>
): Record<string, string> {
  const merged: Record<string, string> = {};

  for (const source of sources) {
    if (!source) {
      continue;
    }

    for (const [key, value] of Object.entries(source)) {
      merged[key.toLowerCase()] = value;
    }
  }

  return merged;
}

function headersToRecord(headers: Headers): Record<string, string> {
  const record: Record<string, string> = {};

  headers.forEach((value, key) => {
    record[key] = value;
  });

  return record;
}

function createRequestSignal(timeoutMs: number, signal?: AbortSignal) {
  const controller = new AbortController();
  let timeoutHandle: NodeJS.Timeout | undefined;
  let timedOut = false;

  const abortFromSignal = () => {
    controller.abort(signal?.reason);
  };

  if (signal) {
    if (signal.aborted) {
      controller.abort(signal.reason);
    } else {
      signal.addEventListener("abort", abortFromSignal, { once: true });
    }
  }

  if (timeoutMs > 0) {
    timeoutHandle = setTimeout(() => {
      timedOut = true;
      controller.abort(new Error(`Request timed out after ${timeoutMs}ms.`));
    }, timeoutMs);
  }

  return {
    signal: controller.signal,
    didTimeout: () => timedOut,
    cleanup: () => {
      if (timeoutHandle) {
        clearTimeout(timeoutHandle);
      }

      signal?.removeEventListener("abort", abortFromSignal);
    },
  };
}

function delayForAttempt(policy: RetryPolicy, attempt: number): number {
  if (attempt >= policy.maxAttempts) {
    return 0;
  }

  return Math.min(
    policy.maxDelayMs,
    policy.initialDelayMs * policy.backoffMultiplier ** (attempt - 1),
  );
}

async function waitForDelay(delayMs: number): Promise<void> {
  if (delayMs <= 0) {
    return;
  }

  await new Promise((resolve) => {
    setTimeout(resolve, delayMs);
  });
}

function shouldRetry<TBody, TResponse>({
  request,
  response,
  retryPolicy,
  attempt,
}: {
  request: TransportRequest<TBody>;
  response?: TransportResponse<TResponse>;
  retryPolicy: RetryPolicy;
  attempt: number;
}): boolean {
  if (attempt >= retryPolicy.maxAttempts) {
    return false;
  }

  if (!isMethodRetryable(request.method, request.idempotencyKey, retryPolicy)) {
    return false;
  }

  if (!response) {
    return true;
  }

  return retryPolicy.retryableStatusCodes.includes(response.status);
}

function isMethodRetryable(
  method: HttpMethod,
  idempotencyKey: string | undefined,
  retryPolicy: RetryPolicy,
): boolean {
  if (retryPolicy.retryableMethods.includes(method)) {
    return true;
  }

  return method === "POST" && Boolean(idempotencyKey);
}

function toResponseError(response: TransportResponse<unknown>) {
  const common = {
    code: response.envelope.code,
    status: response.status,
    headers: response.headers,
    body: response.rawBody,
    requestId: response.requestId,
  };

  if (response.status === 429) {
    const retryAfterHeader = response.headers["retry-after"];
    const retryAfter = retryAfterHeader ? Number(retryAfterHeader) : undefined;
    return new RateLimitError(response.envelope.msg ?? "YunExpress rate limit exceeded.", {
      ...common,
      retryAfter: Number.isFinite(retryAfter) ? retryAfter : undefined,
    });
  }

  if (response.status === 401 || response.status === 403) {
    return new AuthenticationError(
      response.envelope.msg ?? "YunExpress authentication failed.",
      common,
    );
  }

  return new UpstreamApiError(
    response.envelope.msg ?? `YunExpress request failed with status ${response.status}.`,
    common,
  );
}
