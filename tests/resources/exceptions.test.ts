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
  test("getReceiveAddresses sends GET to the official endpoint", async () => {
    const fetchMock = vi.fn(async (input: any, init: any) => {
      const url = new URL(
        typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url,
      );
      expect(init.method).toBe("GET");
      expect(url.pathname).toBe("/v1/issue/get-receive-address");
      return jsonResponse({ success: true, result: [{ warehouse_code: "W02984" }] });
    });

    const client = createClient(fetchMock);
    const response = await client.exceptions.getReceiveAddresses();
    expect(response.data[0]?.warehouse_code).toBe("W02984");
  });

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

  test("markAsRead sends POST with waybill number", async () => {
    const fetchMock = vi.fn(async (input: any, init: any) => {
      const url = new URL(
        typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url,
      );
      expect(url.pathname).toBe("/v1/issue/read");
      expect(JSON.parse(init.body)).toEqual({ waybill_number: "WB2" });
      return jsonResponse({ success: true, result: null });
    });

    const client = createClient(fetchMock);
    await client.exceptions.markAsRead({ waybillNumber: "WB2" });
  });

  test("getOptions sends GET with waybill_number query", async () => {
    const fetchMock = vi.fn(async (input: any) => {
      const url = new URL(
        typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url,
      );
      expect(url.pathname).toBe("/v1/issue/get-options");
      expect(url.searchParams.get("waybill_number")).toBe("WB3");
      return jsonResponse({ success: true, result: [{ plan_code: "P0001", plan_name: "Plan 1" }] });
    });

    const client = createClient(fetchMock);
    const response = await client.exceptions.getOptions({ waybillNumber: "WB3" });
    expect(response.data[0]?.plan_code).toBe("P0001");
  });

  test("getOrderDetail sends GET with waybill_number query", async () => {
    const fetchMock = vi.fn(async (input: any) => {
      const url = new URL(
        typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url,
      );
      expect(url.pathname).toBe("/v1/issue/get-order-detail");
      expect(url.searchParams.get("waybill_number")).toBe("WB4");
      return jsonResponse({ success: true, result: { waybill_number: "WB4", wo_info: [] } });
    });

    const client = createClient(fetchMock);
    const response = await client.exceptions.getOrderDetail({ waybillNumber: "WB4" });
    expect(response.data.waybill_number).toBe("WB4");
  });
});
