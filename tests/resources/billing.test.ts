import { describe, expect, test, vi } from "vite-plus/test";
import { YunExpressClient, type FetchLike } from "../../src/index.ts";
import { NoopRequestSigner } from "../../src/auth/signing/RequestSigner.ts";
import { assertValidGetFreightDetailRequest } from "../../src/resources/billing/types.ts";
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

describe("assertValidGetFreightDetailRequest", () => {
  test("passes with valid waybill number", () => {
    expect(() => assertValidGetFreightDetailRequest({ waybillNumber: "WB1" })).not.toThrow();
  });

  test("rejects empty waybill number", () => {
    expect(() => assertValidGetFreightDetailRequest({ waybillNumber: "" })).toThrow("required");
  });

  test("rejects whitespace-only waybill number", () => {
    expect(() => assertValidGetFreightDetailRequest({ waybillNumber: "   " })).toThrow("required");
  });

  test("throws RequestExecutionError", () => {
    let error: unknown;
    try {
      assertValidGetFreightDetailRequest({ waybillNumber: "" });
    } catch (e) {
      error = e;
    }
    expect(error).toBeInstanceOf(RequestExecutionError);
  });
});

describe("BillingResource request construction", () => {
  test("getBillingDetail sends GET with all optional params", async () => {
    const fetchMock = vi.fn(async (input: any) => {
      const url = new URL(
        typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url,
      );
      expect(url.pathname).toBe("/v1/billing/detail/get");
      expect(url.searchParams.get("waybill_number")).toBe("WB1");
      expect(url.searchParams.get("start_date")).toBe("2025-01-01");
      expect(url.searchParams.get("end_date")).toBe("2025-01-31");
      expect(url.searchParams.get("page")).toBe("1");
      expect(url.searchParams.get("page_size")).toBe("20");
      return jsonResponse({ success: true, result: [] });
    });

    const client = createClient(fetchMock);
    await client.billing.getBillingDetail({
      waybillNumber: "WB1",
      startDate: "2025-01-01",
      endDate: "2025-01-31",
      page: 1,
      pageSize: 20,
    });
  });

  test("getBillingDetail works with no params", async () => {
    const fetchMock = vi.fn(async (input: any) => {
      const url = new URL(
        typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url,
      );
      expect(url.pathname).toBe("/v1/billing/detail/get");
      return jsonResponse({ success: true, result: [] });
    });

    const client = createClient(fetchMock);
    await client.billing.getBillingDetail();
  });

  test("getFreightDetail sends GET with waybill_number", async () => {
    const fetchMock = vi.fn(async (input: any) => {
      const url = new URL(
        typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url,
      );
      expect(url.pathname).toBe("/v1/freight/detail/get");
      expect(url.searchParams.get("waybill_number")).toBe("WB1");
      return jsonResponse({ success: true, result: { total_amount: 100 } });
    });

    const client = createClient(fetchMock);
    const res = await client.billing.getFreightDetail({ waybillNumber: "WB1" });
    expect(res.data.total_amount).toBe(100);
  });
});
