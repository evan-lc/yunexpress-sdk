import { describe, expect, test, vi } from "vite-plus/test";
import {
  DEFAULT_RETRY_POLICY,
  YunExpressTransport,
  normalizeRetryPolicy,
  type FetchLike,
  type TransportDependencies,
} from "../../src/http/transport.ts";
import { DefaultApiEnvelopeParser } from "../../src/http/responseParser.ts";
import {
  AuthenticationError,
  RateLimitError,
  RequestExecutionError,
  UpstreamApiError,
} from "../../src/errors/index.ts";
import type { AuthProvider } from "../../src/auth/AuthProvider.ts";

function jsonResponse(body: unknown, init: ResponseInit = {}): Response {
  const headers = new Headers(init.headers);
  if (!headers.has("content-type")) {
    headers.set("content-type", "application/json");
  }
  return new Response(JSON.stringify(body), { ...init, headers });
}

function noopAuthProvider(): AuthProvider {
  return {
    getHeaders: async () => ({ token: "test-token", date: "123", sign: "" }),
  };
}

function createTransport(
  fetchMock: FetchLike,
  overrides: Partial<TransportDependencies> = {},
): YunExpressTransport {
  return new YunExpressTransport({
    environment: "sandbox",
    baseUrl: "https://openapi-sbx.yunexpress.cn",
    timeoutMs: 10_000,
    retries: { ...DEFAULT_RETRY_POLICY, maxAttempts: 1 },
    authProvider: noopAuthProvider(),
    fetch: fetchMock,
    headers: {},
    responseParser: new DefaultApiEnvelopeParser(),
    debug: false,
    requestInterceptors: [],
    responseInterceptors: [],
    ...overrides,
  });
}

describe("YunExpressTransport", () => {
  test("executes a successful GET request with envelope parsing", async () => {
    const fetchMock = vi.fn(async () =>
      jsonResponse({
        request_id: "req-1",
        success: true,
        code: 0,
        result: { id: 42 },
      }),
    );

    const transport = createTransport(fetchMock as FetchLike);
    const response = await transport.execute<{ id: number }>({
      method: "GET",
      path: "/v1/test",
    });

    expect(response.ok).toBe(true);
    expect(response.status).toBe(200);
    expect(response.data).toEqual({ id: 42 });
    expect(response.requestId).toBe("req-1");
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  test("serializes query parameters including arrays", async () => {
    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      const url = new URL(
        typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url,
      );
      expect(url.searchParams.getAll("ids")).toEqual(["1", "2", "3"]);
      expect(url.searchParams.get("verbose")).toBe("true");
      return jsonResponse({ success: true, result: null });
    });

    const transport = createTransport(fetchMock as FetchLike);
    await transport.execute({
      method: "GET",
      path: "/v1/items",
      query: { ids: [1, 2, 3], verbose: true },
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  test("serializes Date query values as ISO strings", async () => {
    const date = new Date("2025-01-15T10:00:00.000Z");
    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      const url = new URL(
        typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url,
      );
      expect(url.searchParams.get("since")).toBe(date.toISOString());
      return jsonResponse({ success: true, result: null });
    });

    const transport = createTransport(fetchMock as FetchLike);
    await transport.execute({
      method: "GET",
      path: "/v1/items",
      query: { since: date },
    });
  });

  test("skips null and undefined query values", async () => {
    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      const url = new URL(
        typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url,
      );
      expect(url.searchParams.has("empty")).toBe(false);
      expect(url.searchParams.has("missing")).toBe(false);
      expect(url.searchParams.get("present")).toBe("yes");
      return jsonResponse({ success: true, result: null });
    });

    const transport = createTransport(fetchMock as FetchLike);
    await transport.execute({
      method: "GET",
      path: "/v1/items",
      query: { present: "yes", empty: null, missing: undefined },
    });
  });

  test("sends JSON body for POST requests", async () => {
    const fetchMock = vi.fn(async (_input: any, init?: RequestInit) => {
      expect(init?.method).toBe("POST");
      expect(new Headers(init?.headers).get("content-type")).toBe("application/json");
      const body = JSON.parse(init?.body as string);
      expect(body).toEqual({ name: "test" });
      return jsonResponse({ success: true, result: { id: 1 } });
    });

    const transport = createTransport(fetchMock as FetchLike);
    await transport.execute({
      method: "POST",
      path: "/v1/create",
      body: { name: "test" },
    });
  });

  test("injects auth headers from the auth provider", async () => {
    const authProvider: AuthProvider = {
      getHeaders: async () => ({
        token: "auth-tok",
        date: "1234567890000",
        sign: "test-sign",
      }),
    };

    const fetchMock = vi.fn(async (_input: any, init?: RequestInit) => {
      const headers = new Headers(init?.headers);
      expect(headers.get("token")).toBe("auth-tok");
      expect(headers.get("date")).toBe("1234567890000");
      expect(headers.get("sign")).toBe("test-sign");
      return jsonResponse({ success: true, result: null });
    });

    const transport = createTransport(fetchMock as FetchLike, { authProvider });
    await transport.execute({ method: "GET", path: "/v1/test" });
  });

  test("injects idempotency-key header when provided", async () => {
    const fetchMock = vi.fn(async (_input: any, init?: RequestInit) => {
      expect(new Headers(init?.headers).get("idempotency-key")).toBe("idem-1");
      return jsonResponse({ success: true, result: null });
    });

    const transport = createTransport(fetchMock as FetchLike);
    await transport.execute({
      method: "POST",
      path: "/v1/create",
      idempotencyKey: "idem-1",
    });
  });

  test("maps 429 response to RateLimitError with retryAfter", async () => {
    const fetchMock = vi.fn(async () =>
      jsonResponse(
        { success: false, code: 429001, msg: "rate limited", result: null },
        { status: 429, headers: { "retry-after": "30" } },
      ),
    );

    const transport = createTransport(fetchMock as FetchLike);

    let error: unknown;
    try {
      await transport.execute({ method: "GET", path: "/v1/test" });
    } catch (e) {
      error = e;
    }

    expect(error).toBeInstanceOf(RateLimitError);
    const rle = error as RateLimitError;
    expect(rle.retryAfter).toBe(30);
    expect(rle.status).toBe(429);
  });

  test("maps 401 response to AuthenticationError", async () => {
    const fetchMock = vi.fn(async () =>
      jsonResponse({ success: false, msg: "unauthorized", result: null }, { status: 401 }),
    );

    const transport = createTransport(fetchMock as FetchLike);

    let error: unknown;
    try {
      await transport.execute({ method: "GET", path: "/v1/test" });
    } catch (e) {
      error = e;
    }

    expect(error).toBeInstanceOf(AuthenticationError);
    expect((error as AuthenticationError).status).toBe(401);
  });

  test("maps 403 response to AuthenticationError", async () => {
    const fetchMock = vi.fn(async () =>
      jsonResponse({ success: false, msg: "forbidden", result: null }, { status: 403 }),
    );

    const transport = createTransport(fetchMock as FetchLike);

    let error: unknown;
    try {
      await transport.execute({ method: "GET", path: "/v1/test" });
    } catch (e) {
      error = e;
    }

    expect(error).toBeInstanceOf(AuthenticationError);
  });

  test("maps envelope success:false to UpstreamApiError", async () => {
    const fetchMock = vi.fn(async () =>
      jsonResponse({
        request_id: "req-err",
        success: false,
        code: "INVALID_ORDER",
        msg: "order invalid",
        result: null,
      }),
    );

    const transport = createTransport(fetchMock as FetchLike);

    let error: unknown;
    try {
      await transport.execute({ method: "POST", path: "/v1/order" });
    } catch (e) {
      error = e;
    }

    expect(error).toBeInstanceOf(UpstreamApiError);
    const ue = error as UpstreamApiError;
    expect(ue.code).toBe("INVALID_ORDER");
    expect(ue.requestId).toBe("req-err");
    expect(ue.status).toBe(200);
  });

  test("maps 500 response to UpstreamApiError", async () => {
    const fetchMock = vi.fn(async () =>
      jsonResponse({ success: false, msg: "internal error", result: null }, { status: 500 }),
    );

    const transport = createTransport(fetchMock as FetchLike);

    let error: unknown;
    try {
      await transport.execute({ method: "GET", path: "/v1/test" });
    } catch (e) {
      error = e;
    }

    expect(error).toBeInstanceOf(UpstreamApiError);
  });

  test("throws RequestExecutionError on network failure", async () => {
    const fetchMock = vi.fn(async () => {
      throw new TypeError("fetch failed");
    });

    const transport = createTransport(fetchMock as FetchLike);

    let error: unknown;
    try {
      await transport.execute({ method: "GET", path: "/v1/test" });
    } catch (e) {
      error = e;
    }

    expect(error).toBeInstanceOf(RequestExecutionError);
  });

  test("retries on retryable status codes for idempotent methods", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse({ success: false, result: null }, { status: 503 }))
      .mockResolvedValueOnce(jsonResponse({ success: true, result: { ok: true } }));

    const transport = createTransport(fetchMock as unknown as FetchLike, {
      retries: {
        ...DEFAULT_RETRY_POLICY,
        maxAttempts: 2,
        initialDelayMs: 0,
        maxDelayMs: 0,
      },
    });

    const response = await transport.execute<{ ok: boolean }>({
      method: "GET",
      path: "/v1/test",
    });

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(response.data.ok).toBe(true);
  });

  test("retries POST with idempotency key on retryable status", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse({ success: false, result: null }, { status: 503 }))
      .mockResolvedValueOnce(jsonResponse({ success: true, result: { created: true } }));

    const transport = createTransport(fetchMock as unknown as FetchLike, {
      retries: {
        ...DEFAULT_RETRY_POLICY,
        maxAttempts: 2,
        initialDelayMs: 0,
        maxDelayMs: 0,
      },
    });

    const response = await transport.execute<{ created: boolean }>({
      method: "POST",
      path: "/v1/create",
      idempotencyKey: "key-1",
    });

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(response.data.created).toBe(true);
  });

  test("does not retry POST without idempotency key", async () => {
    const fetchMock = vi.fn(async () =>
      jsonResponse({ success: false, msg: "error", result: null }, { status: 503 }),
    );

    const transport = createTransport(fetchMock as FetchLike, {
      retries: {
        ...DEFAULT_RETRY_POLICY,
        maxAttempts: 3,
        initialDelayMs: 0,
        maxDelayMs: 0,
      },
    });

    let error: unknown;
    try {
      await transport.execute({ method: "POST", path: "/v1/create" });
    } catch (e) {
      error = e;
    }

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(error).toBeInstanceOf(UpstreamApiError);
  });

  test("request interceptor modifies the prepared request", async () => {
    const fetchMock = vi.fn(async (_input: any, init?: RequestInit) => {
      expect(new Headers(init?.headers).get("x-custom")).toBe("injected");
      return jsonResponse({ success: true, result: null });
    });

    const transport = createTransport(fetchMock as FetchLike, {
      requestInterceptors: [
        (req) => ({
          ...req,
          headers: { ...req.headers, "x-custom": "injected" },
        }),
      ],
    });

    await transport.execute({ method: "GET", path: "/v1/test" });
  });

  test("response interceptor modifies the transport response", async () => {
    const fetchMock = vi.fn(async () => jsonResponse({ success: true, result: { value: 1 } }));

    const transport = createTransport(fetchMock as FetchLike, {
      responseInterceptors: [
        (res) => ({
          ...res,
          data: { value: 999 },
        }),
      ],
    });

    const response = await transport.execute<{ value: number }>({
      method: "GET",
      path: "/v1/test",
    });

    expect(response.data.value).toBe(999);
  });

  test("merges per-request headers with global headers", async () => {
    const fetchMock = vi.fn(async (_input: any, init?: RequestInit) => {
      const headers = new Headers(init?.headers);
      expect(headers.get("x-global")).toBe("g");
      expect(headers.get("x-local")).toBe("l");
      return jsonResponse({ success: true, result: null });
    });

    const transport = createTransport(fetchMock as FetchLike, {
      headers: { "x-global": "g" },
    });

    await transport.execute({
      method: "GET",
      path: "/v1/test",
      headers: { "x-local": "l" },
    });
  });
});

describe("normalizeRetryPolicy", () => {
  test("false disables retries (maxAttempts: 1)", () => {
    const policy = normalizeRetryPolicy(false);
    expect(policy.maxAttempts).toBe(1);
  });

  test("number sets maxAttempts", () => {
    const policy = normalizeRetryPolicy(3);
    expect(policy.maxAttempts).toBe(3);
  });

  test("number below 1 is clamped to 1", () => {
    const policy = normalizeRetryPolicy(0);
    expect(policy.maxAttempts).toBe(1);
  });

  test("partial object is merged with fallback", () => {
    const policy = normalizeRetryPolicy({ maxAttempts: 5, initialDelayMs: 100 });
    expect(policy.maxAttempts).toBe(5);
    expect(policy.initialDelayMs).toBe(100);
    expect(policy.backoffMultiplier).toBe(DEFAULT_RETRY_POLICY.backoffMultiplier);
    expect(policy.retryableStatusCodes).toEqual(DEFAULT_RETRY_POLICY.retryableStatusCodes);
  });

  test("undefined returns the fallback", () => {
    const policy = normalizeRetryPolicy(undefined);
    expect(policy).toEqual(DEFAULT_RETRY_POLICY);
  });

  test("custom fallback is used when provided", () => {
    const custom = { ...DEFAULT_RETRY_POLICY, maxAttempts: 10 };
    const policy = normalizeRetryPolicy(undefined, custom);
    expect(policy.maxAttempts).toBe(10);
  });
});
