import { describe, expect, test, vi } from "vite-plus/test";
import { YunExpressClient, type FetchLike } from "../../src/index.ts";
import { NoopRequestSigner } from "../../src/auth/signing/RequestSigner.ts";
import { assertValidReleaseIssueRequest } from "../../src/resources/exceptions/types.ts";
import { RequestExecutionError } from "../../src/errors/RequestExecutionError.ts";

function jsonResponse(body: unknown): Response {
  return new Response(JSON.stringify(body), {
    headers: { "content-type": "application/json" },
  });
}

function createClient(fetchMock: ReturnType<typeof vi.fn>) {
  return new YunExpressClient({
    auth: { kind: "sandbox", accessToken: "tok", signer: new NoopRequestSigner() },
    fetch: fetchMock as unknown as FetchLike,
  });
}

describe("assertValidReleaseIssueRequest", () => {
  test("passes with valid input", () => {
    expect(() => assertValidReleaseIssueRequest({ waybillNumber: "WB1" })).not.toThrow();
  });

  test("rejects empty waybill number", () => {
    expect(() => assertValidReleaseIssueRequest({ waybillNumber: "" })).toThrow("required");
  });

  test("rejects whitespace-only waybill number", () => {
    expect(() => assertValidReleaseIssueRequest({ waybillNumber: "   " })).toThrow("required");
  });

  test("rejects waybill number > 50 chars", () => {
    expect(() => assertValidReleaseIssueRequest({ waybillNumber: "W".repeat(51) })).toThrow(
      "50 characters",
    );
  });

  test("rejects remark > 255 chars", () => {
    expect(() =>
      assertValidReleaseIssueRequest({ waybillNumber: "WB1", remark: "r".repeat(256) }),
    ).toThrow("255 characters");
  });

  test("accepts remark of exactly 255 chars", () => {
    expect(() =>
      assertValidReleaseIssueRequest({ waybillNumber: "WB1", remark: "r".repeat(255) }),
    ).not.toThrow();
  });

  test("rejects newWaybillNumbers > 100 items", () => {
    const numbers = Array.from({ length: 101 }, (_, i) => `WB${i}`);
    expect(() =>
      assertValidReleaseIssueRequest({ waybillNumber: "WB1", newWaybillNumbers: numbers }),
    ).toThrow("at most 100");
  });

  test("rejects split and merge codes together", () => {
    expect(() =>
      assertValidReleaseIssueRequest({
        waybillNumber: "WB1",
        extraCodes: ["204", "205"],
      }),
    ).toThrow("mutually exclusive");
  });

  test("allows split code alone", () => {
    expect(() =>
      assertValidReleaseIssueRequest({
        waybillNumber: "WB1",
        extraCodes: ["205"],
      }),
    ).not.toThrow();
  });

  test("allows merge code alone", () => {
    expect(() =>
      assertValidReleaseIssueRequest({
        waybillNumber: "WB1",
        extraCodes: ["204"],
      }),
    ).not.toThrow();
  });

  test("allows other codes like 203 and 206 together", () => {
    expect(() =>
      assertValidReleaseIssueRequest({
        waybillNumber: "WB1",
        extraCodes: ["203", "206"],
      }),
    ).not.toThrow();
  });

  test("throws RequestExecutionError", () => {
    let error: unknown;
    try {
      assertValidReleaseIssueRequest({ waybillNumber: "" });
    } catch (e) {
      error = e;
    }
    expect(error).toBeInstanceOf(RequestExecutionError);
  });
});

describe("ExceptionsResource request construction", () => {
  test("releaseIssue sends POST with correct body", async () => {
    const fetchMock = vi.fn(async (input: any, init: any) => {
      const url = new URL(
        typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url,
      );
      expect(url.pathname).toBe("/v1/issue/release");
      const body = JSON.parse(init.body);
      expect(body.waybill_number).toBe("WB1");
      expect(body.remark).toBe("fix");
      expect(body.extra_codes).toEqual(["203"]);
      return jsonResponse({ success: true, result: null });
    });

    const client = createClient(fetchMock);
    await client.exceptions.releaseIssue({
      waybillNumber: "WB1",
      remark: "fix",
      extraCodes: ["203"],
    });
  });
});
