import { describe, expect, test, vi } from "vite-plus/test";
import { YunExpressClient, type FetchLike } from "../../src/index.ts";
import { NoopRequestSigner } from "../../src/auth/signing/RequestSigner.ts";
import {
  assertValidGetTrackingInfoRequest,
  assertValidWaybillNumbersRequest,
  assertValidProductCodesRequest,
  assertValidGetTrackingSubscriptionByProductRequest,
} from "../../src/resources/tracking/types.ts";

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

describe("assertValidGetTrackingInfoRequest", () => {
  test("passes with valid order number", () => {
    expect(() => assertValidGetTrackingInfoRequest({ orderNumber: "YT123" })).not.toThrow();
  });

  test("rejects empty order number", () => {
    expect(() => assertValidGetTrackingInfoRequest({ orderNumber: "" })).toThrow("required");
  });

  test("rejects whitespace-only", () => {
    expect(() => assertValidGetTrackingInfoRequest({ orderNumber: "  " })).toThrow("required");
  });

  test("rejects order number > 50 chars", () => {
    expect(() => assertValidGetTrackingInfoRequest({ orderNumber: "A".repeat(51) })).toThrow(
      "50 characters",
    );
  });
});

describe("assertValidWaybillNumbersRequest", () => {
  test("passes with valid array", () => {
    expect(() => assertValidWaybillNumbersRequest(["WB1"], 50)).not.toThrow();
  });

  test("rejects empty array", () => {
    expect(() => assertValidWaybillNumbersRequest([], 50)).toThrow("at least one");
  });

  test("rejects array exceeding max", () => {
    const numbers = Array.from({ length: 51 }, (_, i) => `WB${i}`);
    expect(() => assertValidWaybillNumbersRequest(numbers, 50)).toThrow("at most 50");
  });
});

describe("assertValidProductCodesRequest", () => {
  test("passes with valid array", () => {
    expect(() => assertValidProductCodesRequest(["PC1"], 50)).not.toThrow();
  });

  test("rejects empty array", () => {
    expect(() => assertValidProductCodesRequest([], 50)).toThrow("at least one");
  });

  test("rejects array exceeding max", () => {
    const codes = Array.from({ length: 51 }, (_, i) => `PC${i}`);
    expect(() => assertValidProductCodesRequest(codes, 50)).toThrow("at most 50");
  });
});

describe("assertValidGetTrackingSubscriptionByProductRequest", () => {
  test("passes with valid product code", () => {
    expect(() =>
      assertValidGetTrackingSubscriptionByProductRequest({ productCode: "THZXR" }),
    ).not.toThrow();
  });

  test("rejects empty product code", () => {
    expect(() => assertValidGetTrackingSubscriptionByProductRequest({ productCode: " " })).toThrow(
      "required",
    );
  });
});

describe("TrackingResource request construction", () => {
  test("getTrackingInfo sends GET to correct path", async () => {
    const fetchMock = vi.fn(async (input: any) => {
      const url = new URL(
        typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url,
      );
      expect(url.pathname).toBe("/v1/track-service/info/get");
      expect(url.searchParams.get("order_number")).toBe("YT123");
      return jsonResponse({ success: true, result: {} });
    });

    const client = createClient(fetchMock);
    await client.tracking.getTrackingInfo({ orderNumber: "YT123" });
  });

  test("subscribeByWaybill sends POST to correct path", async () => {
    const fetchMock = vi.fn(async (input: any, init: any) => {
      const url = new URL(
        typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url,
      );
      expect(url.pathname).toBe("/v1/track-service/subscription/waybill/add");
      const body = JSON.parse(init.body);
      expect(body.waybill_numbers).toEqual(["WB1", "WB2"]);
      return jsonResponse({ success: true, result: null });
    });

    const client = createClient(fetchMock);
    await client.tracking.subscribeByWaybill({ waybillNumbers: ["WB1", "WB2"] });
  });

  test("cancelSubscriptionByWaybill sends POST", async () => {
    const fetchMock = vi.fn(async (input: any) => {
      const url = new URL(
        typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url,
      );
      expect(url.pathname).toBe("/v1/track-service/subscription/waybill/cancel");
      return jsonResponse({ success: true, result: null });
    });

    const client = createClient(fetchMock);
    await client.tracking.cancelSubscriptionByWaybill({ waybillNumbers: ["WB1"] });
  });

  test("getSubscriptionByWaybill comma-joins waybill numbers", async () => {
    const fetchMock = vi.fn(async (input: any) => {
      const url = new URL(
        typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url,
      );
      expect(url.pathname).toBe("/v1/track-service/subscription/waybill/get");
      expect(url.searchParams.get("waybill_numbers")).toBe("WB1,WB2,WB3");
      return jsonResponse({ success: true, result: [] });
    });

    const client = createClient(fetchMock);
    await client.tracking.getSubscriptionByWaybill({ waybillNumbers: ["WB1", "WB2", "WB3"] });
  });

  test("subscribeByProduct sends POST to correct path", async () => {
    const fetchMock = vi.fn(async (input: any, init: any) => {
      const url = new URL(
        typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url,
      );
      expect(url.pathname).toBe("/v1/track-service/subscription/product/add");
      const body = JSON.parse(init.body);
      expect(body.product_codes).toEqual(["P1"]);
      return jsonResponse({ success: true, result: null });
    });

    const client = createClient(fetchMock);
    await client.tracking.subscribeByProduct({ productCodes: ["P1"] });
  });

  test("cancelSubscriptionByProduct sends POST", async () => {
    const fetchMock = vi.fn(async (input: any) => {
      const url = new URL(
        typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url,
      );
      expect(url.pathname).toBe("/v1/track-service/subscription/product/cancel");
      return jsonResponse({ success: true, result: null });
    });

    const client = createClient(fetchMock);
    await client.tracking.cancelSubscriptionByProduct({ productCodes: ["P1"] });
  });

  test("getSubscriptionByProduct sends GET with product_code", async () => {
    const fetchMock = vi.fn(async (input: any) => {
      const url = new URL(
        typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url,
      );
      expect(url.pathname).toBe("/v1/track-service/subscription/product/get");
      expect(url.searchParams.get("product_code")).toBe("THZXR");
      return jsonResponse({ success: true, result: [] });
    });

    const client = createClient(fetchMock);
    await client.tracking.getSubscriptionByProduct({ productCode: "THZXR" });
  });
});
