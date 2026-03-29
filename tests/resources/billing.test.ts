import { describe, expect, test, vi } from "vite-plus/test";
import { YunExpressClient, type FetchLike } from "../../src/index.ts";
import { NoopRequestSigner } from "../../src/auth/signing/RequestSigner.ts";
import {
  assertValidGetBillingDetailRequest,
  assertValidGetFreightDetailRequest,
} from "../../src/resources/billing/types.ts";
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
  test("passes with valid billing detail input", () => {
    expect(() =>
      assertValidGetBillingDetailRequest({
        billCode: "BILL-1",
        billType: "N",
        pageNo: 1,
        pageSize: 10,
      }),
    ).not.toThrow();
  });

  test("rejects empty billing code", () => {
    expect(() => assertValidGetBillingDetailRequest({ billCode: "", billType: "N" })).toThrow(
      "billCode is required",
    );
  });

  test("rejects invalid billing type", () => {
    expect(() =>
      assertValidGetBillingDetailRequest({ billCode: "BILL-1", billType: "X" as any }),
    ).toThrow("billType must be one of");
  });

  test("rejects invalid page size", () => {
    expect(() =>
      assertValidGetBillingDetailRequest({ billCode: "BILL-1", billType: "N", pageSize: 101 }),
    ).toThrow("pageSize must be an integer between 1 and 100");
  });

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
  test("getBillingDetail sends GET with documented params", async () => {
    const fetchMock = vi.fn(async (input: any) => {
      const url = new URL(
        typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url,
      );
      expect(url.pathname).toBe("/v1/bill/details/list");
      expect(url.searchParams.get("bill_code")).toBe("BILL-1");
      expect(url.searchParams.get("bill_type")).toBe("N");
      expect(url.searchParams.get("page_no")).toBe("1");
      expect(url.searchParams.get("page_size")).toBe("20");
      return jsonResponse({ success: true, result: { expenditure_records: [] } });
    });

    const client = createClient(fetchMock);
    await client.billing.getBillingDetail({
      billCode: "BILL-1",
      billType: "N",
      pageNo: 1,
      pageSize: 20,
    });
  });

  test("getBillingDetail applies documented pagination defaults", async () => {
    const fetchMock = vi.fn(async (input: any) => {
      const url = new URL(
        typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url,
      );
      expect(url.pathname).toBe("/v1/bill/details/list");
      expect(url.searchParams.get("bill_code")).toBe("BILL-2");
      expect(url.searchParams.get("bill_type")).toBe("I");
      expect(url.searchParams.get("page_no")).toBe("1");
      expect(url.searchParams.get("page_size")).toBe("10");
      return jsonResponse({ success: true, result: { receipt: [] } });
    });

    const client = createClient(fetchMock);
    await client.billing.getBillingDetail({ billCode: "BILL-2", billType: "I" });
  });

  test("getFreightDetail sends GET with waybill_number", async () => {
    const fetchMock = vi.fn(async (input: any) => {
      const url = new URL(
        typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url,
      );
      expect(url.pathname).toBe("/v1/order/fee-details/get");
      expect(url.searchParams.get("waybill_number")).toBe("WB1");
      return jsonResponse({ success: true, result: { total_amount: 100 } });
    });

    const client = createClient(fetchMock);
    const res = await client.billing.getFreightDetail({ waybillNumber: "WB1" });
    expect(res.data.total_amount).toBe(100);
  });
});
