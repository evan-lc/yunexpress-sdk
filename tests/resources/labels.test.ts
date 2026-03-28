import { describe, expect, test, vi } from "vite-plus/test";
import { YunExpressClient, type FetchLike } from "../../src/index.ts";
import { NoopRequestSigner } from "../../src/auth/signing/RequestSigner.ts";
import { assertValidOrderNumberRequest } from "../../src/resources/labels/types.ts";
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

describe("assertValidOrderNumberRequest", () => {
  test("passes with valid order number", () => {
    expect(() => assertValidOrderNumberRequest({ orderNumber: "ORDER-1" })).not.toThrow();
  });

  test("rejects empty order number", () => {
    expect(() => assertValidOrderNumberRequest({ orderNumber: "" })).toThrow("required");
  });

  test("rejects whitespace-only order number", () => {
    expect(() => assertValidOrderNumberRequest({ orderNumber: "   " })).toThrow("required");
  });

  test("rejects order number longer than 50 chars", () => {
    expect(() => assertValidOrderNumberRequest({ orderNumber: "X".repeat(51) })).toThrow(
      "50 characters",
    );
  });

  test("throws RequestExecutionError", () => {
    let error: unknown;
    try {
      assertValidOrderNumberRequest({ orderNumber: "" });
    } catch (e) {
      error = e;
    }
    expect(error).toBeInstanceOf(RequestExecutionError);
  });
});

describe("LabelsResource request construction", () => {
  test("getLabel sends GET to /v1/order/label/get", async () => {
    const fetchMock = vi.fn(async (input: any) => {
      const url = new URL(
        typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url,
      );
      expect(url.pathname).toBe("/v1/order/label/get");
      expect(url.searchParams.get("order_number")).toBe("ORD-1");
      return jsonResponse({ success: true, result: { url: "https://label.pdf" } });
    });

    const client = createClient(fetchMock);
    const res = await client.labels.getLabel({ orderNumber: "ORD-1" });
    expect(res.data.url).toBe("https://label.pdf");
  });

  test("getShippingDocs sends GET to /v1/order/shipping-docs/get", async () => {
    const fetchMock = vi.fn(async (input: any) => {
      const url = new URL(
        typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url,
      );
      expect(url.pathname).toBe("/v1/order/shipping-docs/get");
      expect(url.searchParams.get("order_number")).toBe("ORD-2");
      return jsonResponse({ success: true, result: {} });
    });

    const client = createClient(fetchMock);
    await client.labels.getShippingDocs({ orderNumber: "ORD-2" });
  });

  test("getPod sends GET to /v1/order/pod/get", async () => {
    const fetchMock = vi.fn(async (input: any) => {
      const url = new URL(
        typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url,
      );
      expect(url.pathname).toBe("/v1/order/pod/get");
      expect(url.searchParams.get("order_number")).toBe("ORD-3");
      return jsonResponse({ success: true, result: {} });
    });

    const client = createClient(fetchMock);
    await client.labels.getPod({ orderNumber: "ORD-3" });
  });
});
