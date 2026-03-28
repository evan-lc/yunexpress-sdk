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
} from "../src/index.ts";

describe("YunExpressClient", () => {
  test("orders.createPackage injects sandbox auth headers and parses the envelope", async () => {
    const signer: RequestSigner = {
      sign: ({ date, sourceKey, token }) => `${token}:${sourceKey}:${date}`,
    };

    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      expect(toUrlString(input)).toBe(
        "https://sandbox-openapi.yunexpress.com/v1/order/package/create",
      );

      const headers = new Headers(init?.headers);
      expect(headers.get("token")).toBe("sandbox-token");
      expect(headers.get("sign")).toContain("source-key");
      expect(headers.get("accept-language")).toBe("zh-CN");
      expect(headers.get("idempotency-key")).toBe("pkg-1");

      if (typeof init?.body !== "string") {
        throw new TypeError("Expected a JSON request body.");
      }

      const body = JSON.parse(init.body) as CreatePackageRequest;
      expect(body.customerOrderNumber).toBe("ORDER-1");

      return jsonResponse({
        request_id: "req-sandbox",
        success: true,
        code: 0,
        result: {
          waybillNumber: "YUN123",
        },
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

    const response = await client.orders.createPackage(createPackageRequest(), {
      idempotencyKey: "pkg-1",
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(response.data.waybillNumber).toBe("YUN123");
    expect(response.requestId).toBe("req-sandbox");
  });

  test("request uses the production token provider and serializes query params", async () => {
    const tokenProvider = vi.fn(async ({ apiKey, appId }) => {
      expect(appId).toBe("app-1");
      expect(apiKey).toBe("secret-1");
      return "prod-token";
    });

    const signer: RequestSigner = {
      sign: ({ apiKey, appId, token }) => `${appId}:${apiKey}:${token}`,
    };

    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = new URL(toUrlString(input));
      expect(url.searchParams.getAll("waybillNumber")).toEqual(["WB1", "WB2"]);
      expect(url.searchParams.get("verbose")).toBe("true");

      const headers = new Headers(init?.headers);
      expect(headers.get("token")).toBe("prod-token");
      expect(headers.get("sign")).toBe("app-1:secret-1:prod-token");

      return jsonResponse({
        success: true,
        result: {
          items: [],
        },
      });
    });

    const client = new YunExpressClient({
      auth: {
        kind: "production",
        appId: "app-1",
        apiKey: "secret-1",
        tokenProvider,
        signer,
      },
      fetch: fetchMock as FetchLike,
    });

    const response = await client.request<{ items: string[] }>({
      method: "GET",
      path: "/v1/order/list",
      query: {
        waybillNumber: ["WB1", "WB2"],
        verbose: true,
      },
    });

    expect(tokenProvider).toHaveBeenCalledTimes(1);
    expect(response.data.items).toEqual([]);
  });

  test("transport retries idempotent POST requests on retryable status codes", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        jsonResponse(
          {
            success: false,
            code: "TEMPORARY_FAILURE",
            msg: "please retry",
            result: null,
          },
          { status: 503 },
        ),
      )
      .mockResolvedValueOnce(
        jsonResponse({
          request_id: "req-retry",
          success: true,
          result: {
            waybillNumber: "YUN-RETRY",
          },
        }),
      );

    const client = new YunExpressClient({
      auth: {
        kind: "sandbox",
        accessToken: "sandbox-token",
        signer: new NoopRequestSigner(),
      },
      fetch: fetchMock as unknown as FetchLike,
      retries: {
        maxAttempts: 2,
        initialDelayMs: 0,
        maxDelayMs: 0,
        backoffMultiplier: 1,
      },
    });

    const response = await client.orders.createPackage(createPackageRequest(), {
      idempotencyKey: "retry-key",
    });

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(response.data.waybillNumber).toBe("YUN-RETRY");
  });

  test("orders.createPackage validates package weights before sending", async () => {
    const fetchMock = vi.fn();

    const client = new YunExpressClient({
      auth: {
        kind: "sandbox",
        accessToken: "sandbox-token",
        signer: new NoopRequestSigner(),
      },
      fetch: fetchMock as unknown as FetchLike,
    });

    let error: unknown;
    try {
      await client.orders.createPackage(
        createPackageRequest({
          packages: [{ weight: 1.2345 }],
        }),
      );
    } catch (caught) {
      error = caught;
    }

    expect(error).toBeInstanceOf(RequestExecutionError);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  test("transport maps rate limiting responses", async () => {
    const client = new YunExpressClient({
      auth: {
        kind: "sandbox",
        accessToken: "sandbox-token",
        signer: new NoopRequestSigner(),
      },
      fetch: (async () =>
        jsonResponse(
          {
            success: false,
            code: 429001,
            msg: "slow down",
            result: null,
          },
          {
            status: 429,
            headers: {
              "retry-after": "120",
            },
          },
        )) as FetchLike,
    });

    let error: unknown;
    try {
      await client.request({
        method: "GET",
        path: "/v1/ping",
      });
    } catch (caught) {
      error = caught;
    }

    expect(error).toBeInstanceOf(RateLimitError);
    expect(error).toMatchObject({
      retryAfter: 120,
      status: 429,
    });
  });

  test("transport preserves business envelope failures", async () => {
    const client = new YunExpressClient({
      auth: {
        kind: "sandbox",
        accessToken: "sandbox-token",
        signer: new NoopRequestSigner(),
      },
      fetch: (async () =>
        jsonResponse({
          request_id: "req-business",
          success: false,
          code: "INVALID_ORDER",
          msg: "invalid order data",
          result: null,
        })) as FetchLike,
    });

    let error: unknown;
    try {
      await client.orders.createPackage(createPackageRequest());
    } catch (caught) {
      error = caught;
    }

    expect(error).toBeInstanceOf(UpstreamApiError);
    expect(error).toMatchObject({
      code: "INVALID_ORDER",
      requestId: "req-business",
      status: 200,
    });
  });
});

function createPackageRequest(overrides: Partial<CreatePackageRequest> = {}): CreatePackageRequest {
  return {
    productCode: "STANDARD",
    customerOrderNumber: "ORDER-1",
    weightUnit: "KG",
    sizeUnit: "CM",
    packages: [
      {
        weight: 1.25,
        length: 20,
        width: 15,
        height: 10,
      },
    ],
    receiver: {
      name: "Alice Example",
      countryCode: "US",
      addressLine1: "1 Main Street",
    },
    declarationInfo: [
      {
        name: "T-Shirt",
        quantity: 1,
        declaredValue: 12.5,
        currency: "USD",
      },
    ],
    ...overrides,
  };
}

function jsonResponse(body: unknown, init: ResponseInit = {}): Response {
  const headers = new Headers(init.headers);
  if (!headers.has("content-type")) {
    headers.set("content-type", "application/json");
  }

  return new Response(JSON.stringify(body), {
    ...init,
    headers,
  });
}

function toUrlString(input: RequestInfo | URL): string {
  if (typeof input === "string") {
    return input;
  }

  if (input instanceof URL) {
    return input.toString();
  }

  return input.url;
}
