import { createHmac } from "node:crypto";
import { describe, expect, test, vi } from "vite-plus/test";
import {
  NoopRequestSigner,
  RateLimitError,
  RequestExecutionError,
  UpstreamApiError,
  YunExpressClient,
  type CreatePackageRequest,
  type FetchLike,
  type RequestSigner,
} from "../../src/index.ts";

function jsonResponse(body: unknown, init: ResponseInit = {}): Response {
  const headers = new Headers(init.headers);
  if (!headers.has("content-type")) {
    headers.set("content-type", "application/json");
  }
  return new Response(JSON.stringify(body), { ...init, headers });
}

function toUrlString(input: RequestInfo | URL): string {
  if (typeof input === "string") return input;
  if (input instanceof URL) return input.toString();
  return input.url;
}

function makePackageRequest(overrides: Partial<CreatePackageRequest> = {}): CreatePackageRequest {
  return {
    productCode: "STANDARD",
    customerOrderNumber: "ORDER-1",
    weightUnit: "KG",
    sizeUnit: "CM",
    packages: [{ weight: 1.25, length: 20, width: 15, height: 10 }],
    receiver: { name: "Alice", countryCode: "US", addressLine1: "1 Main St" },
    declarationInfo: [{ name: "T-Shirt", quantity: 1, declaredValue: 12.5, currency: "USD" }],
    ...overrides,
  };
}

describe("Smoke: sandbox flow", () => {
  test("createPackage injects sandbox auth headers and parses envelope", async () => {
    const signer: RequestSigner = {
      sign: ({ date, sourceKey, token }) => `${token}:${sourceKey}:${date}`,
    };

    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      expect(toUrlString(input)).toBe("https://openapi-sbx.yunexpress.cn/v1/order/package/create");

      const headers = new Headers(init?.headers);
      expect(headers.get("token")).toBe("sandbox-token");
      expect(headers.get("sign")).toContain("source-key");
      expect(headers.get("accept-language")).toBe("zh-CN");
      expect(headers.get("idempotency-key")).toBe("pkg-1");

      const body = JSON.parse(init?.body as string) as CreatePackageRequest;
      expect(body.customerOrderNumber).toBe("ORDER-1");

      return jsonResponse({
        request_id: "req-sandbox",
        success: true,
        code: 0,
        result: { waybillNumber: "YUN123" },
      });
    });

    const client = new YunExpressClient({
      auth: {
        kind: "sandbox",
        accessToken: "sandbox-token",
        sourceKey: "source-key",
        uatAccessKey: "uat-key",
        signer,
        acceptLanguage: "zh-CN",
      },
      fetch: fetchMock as FetchLike,
    });

    const response = await client.orders.createPackage(makePackageRequest(), {
      idempotencyKey: "pkg-1",
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(response.data.waybillNumber).toBe("YUN123");
    expect(response.requestId).toBe("req-sandbox");
  });
});

describe("Smoke: production flow", () => {
  test("auto-exchanges OAuth2 token and signs with HMAC-SHA256", async () => {
    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = new URL(toUrlString(input));

      if (url.pathname === "/openapi/oauth2/token") {
        expect(init?.method).toBe("POST");
        expect(JSON.parse(init!.body as string)).toEqual({
          grantType: "client_credentials",
          appId: "app-1",
          appSecret: "secret-1",
          sourceKey: "source-1",
        });

        return jsonResponse({
          accessToken: "auto-token",
          expiresIn: 7200,
        });
      }

      expect(url.origin).toBe("https://openapi.yunexpress.cn");
      expect(url.pathname).toBe("/v1/order/info/get");
      expect(url.searchParams.get("order_number")).toBe("YT2231431267000001");

      const headers = new Headers(init?.headers);
      const date = headers.get("date");
      expect(headers.get("token")).toBe("auto-token");
      expect(date).toMatch(/^\d{13}$/);
      expect(headers.get("sign")).toBe(
        createHmac("sha256", "secret-1")
          .update(`date=${date}&method=GET&uri=/v1/order/info/get`)
          .digest("base64"),
      );

      return jsonResponse({
        success: true,
        result: { waybill_number: "YT2233621266010029" },
      });
    });

    const client = new YunExpressClient({
      auth: {
        kind: "production",
        appId: "app-1",
        apiKey: "secret-1",
        sourceKey: "source-1",
      },
      fetch: fetchMock as FetchLike,
    });

    const res = await client.orders.getWaybillDetail({
      orderNumber: "YT2231431267000001",
    });

    expect(res.data.waybill_number).toBe("YT2233621266010029");

    // Second call reuses cached token (no new exchange)
    await client.orders.getWaybillDetail({ orderNumber: "YT2231431267000001" });
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });
});

describe("Smoke: error mapping", () => {
  test("rate limit response maps to RateLimitError", async () => {
    const client = new YunExpressClient({
      auth: { kind: "sandbox", accessToken: "tok", signer: new NoopRequestSigner() },
      fetch: (async () =>
        jsonResponse(
          { success: false, code: 429001, msg: "slow down", result: null },
          { status: 429, headers: { "retry-after": "120" } },
        )) as FetchLike,
    });

    let error: unknown;
    try {
      await client.request({ method: "GET", path: "/v1/ping" });
    } catch (e) {
      error = e;
    }

    expect(error).toBeInstanceOf(RateLimitError);
    expect(error).toMatchObject({ retryAfter: 120, status: 429 });
  });

  test("business envelope failure maps to UpstreamApiError", async () => {
    const client = new YunExpressClient({
      auth: { kind: "sandbox", accessToken: "tok", signer: new NoopRequestSigner() },
      fetch: (async () =>
        jsonResponse({
          request_id: "req-biz",
          success: false,
          code: "INVALID_ORDER",
          msg: "invalid order data",
          result: null,
        })) as FetchLike,
    });

    let error: unknown;
    try {
      await client.orders.createPackage(makePackageRequest());
    } catch (e) {
      error = e;
    }

    expect(error).toBeInstanceOf(UpstreamApiError);
    expect(error).toMatchObject({
      code: "INVALID_ORDER",
      requestId: "req-biz",
      status: 200,
    });
  });

  test("client-side validation rejects before sending", async () => {
    const fetchMock = vi.fn();
    const client = new YunExpressClient({
      auth: { kind: "sandbox", accessToken: "tok", signer: new NoopRequestSigner() },
      fetch: fetchMock as unknown as FetchLike,
    });

    let error: unknown;
    try {
      await client.orders.createPackage(makePackageRequest({ packages: [{ weight: 1.2345 }] }));
    } catch (e) {
      error = e;
    }

    expect(error).toBeInstanceOf(RequestExecutionError);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  test("transport retries idempotent POST on 503", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        jsonResponse({ success: false, code: "TEMP", msg: "retry", result: null }, { status: 503 }),
      )
      .mockResolvedValueOnce(
        jsonResponse({
          request_id: "req-retry",
          success: true,
          result: { waybillNumber: "YUN-RETRY" },
        }),
      );

    const client = new YunExpressClient({
      auth: { kind: "sandbox", accessToken: "tok", signer: new NoopRequestSigner() },
      fetch: fetchMock as unknown as FetchLike,
      retries: { maxAttempts: 2, initialDelayMs: 0, maxDelayMs: 0, backoffMultiplier: 1 },
    });

    const res = await client.orders.createPackage(makePackageRequest(), {
      idempotencyKey: "retry-key",
    });

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(res.data.waybillNumber).toBe("YUN-RETRY");
  });
});
