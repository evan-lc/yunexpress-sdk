import { describe, expect, test } from "vite-plus/test";
import {
  AuthenticationError,
  RateLimitError,
  RequestExecutionError,
  UpstreamApiError,
  YunExpressError,
} from "../../src/errors/index.ts";

describe("YunExpressError", () => {
  test("stores message and optional fields", () => {
    const error = new YunExpressError("something broke", {
      code: "ERR_BROKEN",
      status: 500,
      headers: { "x-request-id": "abc" },
      body: { detail: "boom" },
      requestId: "req-1",
    });

    expect(error.message).toBe("something broke");
    expect(error.name).toBe("YunExpressError");
    expect(error.code).toBe("ERR_BROKEN");
    expect(error.status).toBe(500);
    expect(error.headers).toEqual({ "x-request-id": "abc" });
    expect(error.body).toEqual({ detail: "boom" });
    expect(error.requestId).toBe("req-1");
  });

  test("defaults optional fields to undefined", () => {
    const error = new YunExpressError("minimal");
    expect(error.code).toBeUndefined();
    expect(error.status).toBeUndefined();
    expect(error.headers).toBeUndefined();
    expect(error.body).toBeUndefined();
    expect(error.requestId).toBeUndefined();
    expect(error.cause).toBeUndefined();
  });

  test("preserves cause", () => {
    const cause = new Error("root");
    const error = new YunExpressError("wrapper", { cause });
    expect(error.cause).toBe(cause);
  });

  test("accepts numeric code", () => {
    const error = new YunExpressError("num code", { code: 42 });
    expect(error.code).toBe(42);
  });

  test("is an instance of Error", () => {
    const error = new YunExpressError("check");
    expect(error).toBeInstanceOf(Error);
    expect(error).toBeInstanceOf(YunExpressError);
  });
});

describe("AuthenticationError", () => {
  test("extends YunExpressError", () => {
    const error = new AuthenticationError("auth failed", { status: 401 });
    expect(error).toBeInstanceOf(YunExpressError);
    expect(error).toBeInstanceOf(AuthenticationError);
    expect(error.name).toBe("AuthenticationError");
    expect(error.status).toBe(401);
  });
});

describe("RateLimitError", () => {
  test("extends YunExpressError and stores retryAfter", () => {
    const error = new RateLimitError("slow down", {
      status: 429,
      retryAfter: 60,
    });
    expect(error).toBeInstanceOf(YunExpressError);
    expect(error).toBeInstanceOf(RateLimitError);
    expect(error.name).toBe("RateLimitError");
    expect(error.retryAfter).toBe(60);
    expect(error.status).toBe(429);
  });

  test("retryAfter defaults to undefined", () => {
    const error = new RateLimitError("slow down");
    expect(error.retryAfter).toBeUndefined();
  });
});

describe("RequestExecutionError", () => {
  test("extends YunExpressError", () => {
    const cause = new TypeError("fetch failed");
    const error = new RequestExecutionError("network error", {
      code: "REQUEST_TIMEOUT",
      cause,
    });
    expect(error).toBeInstanceOf(YunExpressError);
    expect(error).toBeInstanceOf(RequestExecutionError);
    expect(error.name).toBe("RequestExecutionError");
    expect(error.code).toBe("REQUEST_TIMEOUT");
    expect(error.cause).toBe(cause);
  });
});

describe("UpstreamApiError", () => {
  test("extends YunExpressError", () => {
    const error = new UpstreamApiError("bad request", {
      code: "INVALID_ORDER",
      status: 200,
      requestId: "req-42",
      body: { success: false },
    });
    expect(error).toBeInstanceOf(YunExpressError);
    expect(error).toBeInstanceOf(UpstreamApiError);
    expect(error.name).toBe("UpstreamApiError");
    expect(error.code).toBe("INVALID_ORDER");
    expect(error.status).toBe(200);
    expect(error.requestId).toBe("req-42");
  });
});
