import { describe, expect, test } from "vite-plus/test";
import { DefaultApiEnvelopeParser } from "../../src/http/responseParser.ts";

const parser = new DefaultApiEnvelopeParser();
const dummyResponse = new Response(null);

describe("DefaultApiEnvelopeParser", () => {
  test("parses a full envelope with camelCase requestId", () => {
    const payload = {
      requestId: "req-1",
      success: true,
      code: 0,
      msg: "ok",
      result: { id: 42 },
    };

    const envelope = parser.parse<{ id: number }>(payload, dummyResponse);

    expect(envelope.requestId).toBe("req-1");
    expect(envelope.success).toBe(true);
    expect(envelope.code).toBe(0);
    expect(envelope.msg).toBe("ok");
    expect(envelope.result).toEqual({ id: 42 });
    expect(envelope.rawBody).toBe(payload);
  });

  test("parses a full envelope with snake_case request_id", () => {
    const payload = {
      request_id: "req-snake",
      success: true,
      code: 200,
      result: { value: "hello" },
    };

    const envelope = parser.parse(payload, dummyResponse);
    expect(envelope.requestId).toBe("req-snake");
  });

  test("prefers camelCase requestId over snake_case", () => {
    const payload = {
      requestId: "camel",
      request_id: "snake",
      success: true,
      result: null,
    };

    const envelope = parser.parse(payload, dummyResponse);
    expect(envelope.requestId).toBe("camel");
  });

  test("detects envelope by presence of result key alone", () => {
    const payload = { result: [1, 2, 3] };
    const envelope = parser.parse<number[]>(payload, dummyResponse);
    expect(envelope.result).toEqual([1, 2, 3]);
    expect(envelope.success).toBeUndefined();
  });

  test("detects envelope by presence of success key alone", () => {
    const payload = { success: false, msg: "fail" };
    const envelope = parser.parse(payload, dummyResponse);
    expect(envelope.success).toBe(false);
    expect(envelope.msg).toBe("fail");
  });

  test("detects envelope by presence of code key alone", () => {
    const payload = { code: "NOT_FOUND", result: null };
    const envelope = parser.parse(payload, dummyResponse);
    expect(envelope.code).toBe("NOT_FOUND");
  });

  test("passes through non-envelope objects as result", () => {
    const payload = { name: "something", value: 123 };
    const envelope = parser.parse(payload, dummyResponse);
    expect(envelope.result).toBe(payload);
    expect(envelope.rawBody).toBe(payload);
    expect(envelope.requestId).toBeUndefined();
  });

  test("passes through arrays as result", () => {
    const payload = [1, 2, 3];
    const envelope = parser.parse(payload, dummyResponse);
    expect(envelope.result).toEqual([1, 2, 3]);
  });

  test("passes through null as result", () => {
    const envelope = parser.parse(null, dummyResponse);
    expect(envelope.result).toBeNull();
  });

  test("passes through undefined as result", () => {
    const envelope = parser.parse(undefined, dummyResponse);
    expect(envelope.result).toBeUndefined();
  });

  test("passes through strings as result", () => {
    const envelope = parser.parse("raw text", dummyResponse);
    expect(envelope.result).toBe("raw text");
  });

  test("passes through numbers as result", () => {
    const envelope = parser.parse(42, dummyResponse);
    expect(envelope.result).toBe(42);
  });

  test("handles envelope with numeric code", () => {
    const payload = { code: 429001, success: false, result: null, msg: "rate limited" };
    const envelope = parser.parse(payload, dummyResponse);
    expect(envelope.code).toBe(429001);
  });

  test("handles envelope with string code", () => {
    const payload = { code: "INVALID_ORDER", success: false, result: null };
    const envelope = parser.parse(payload, dummyResponse);
    expect(envelope.code).toBe("INVALID_ORDER");
  });

  test("handles envelope where code is not string or number", () => {
    const payload = { code: true, success: true, result: "data" };
    const envelope = parser.parse(payload, dummyResponse);
    expect(envelope.code).toBeUndefined();
  });

  test("reads t field from envelope", () => {
    const payload = { t: "1234567890", success: true, result: null };
    const envelope = parser.parse(payload, dummyResponse);
    expect(envelope.t).toBe("1234567890");
  });

  test("handles envelope with success: false and null result", () => {
    const payload = {
      request_id: "req-fail",
      success: false,
      code: "ERROR",
      msg: "something went wrong",
      result: null,
    };

    const envelope = parser.parse(payload, dummyResponse);
    expect(envelope.success).toBe(false);
    expect(envelope.result).toBeNull();
    expect(envelope.msg).toBe("something went wrong");
    expect(envelope.requestId).toBe("req-fail");
  });
});
