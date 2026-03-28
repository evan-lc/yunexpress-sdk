import { describe, expect, test, vi } from "vite-plus/test";
import { YunExpressClient, type FetchLike } from "../../src/index.ts";
import { NoopRequestSigner } from "../../src/auth/signing/RequestSigner.ts";
import { OrdersResource } from "../../src/resources/orders/OrdersResource.ts";
import { LabelsResource } from "../../src/resources/labels/LabelsResource.ts";
import { TrackingResource } from "../../src/resources/tracking/TrackingResource.ts";
import { PricingResource } from "../../src/resources/pricing/PricingResource.ts";
import { ExceptionsResource } from "../../src/resources/exceptions/ExceptionsResource.ts";
import { ReturnsResource } from "../../src/resources/returns/ReturnsResource.ts";
import { BillingResource } from "../../src/resources/billing/BillingResource.ts";
import { BasicResource } from "../../src/resources/basic/BasicResource.ts";

function jsonResponse(body: unknown): Response {
  return new Response(JSON.stringify(body), {
    headers: { "content-type": "application/json" },
  });
}

function createClient(overrides: Record<string, unknown> = {}) {
  const fetchMock = vi.fn(async () => jsonResponse({ success: true, result: null }));

  return {
    client: new YunExpressClient({
      auth: {
        kind: "sandbox",
        accessToken: "tok",
        signer: new NoopRequestSigner(),
      },
      fetch: fetchMock as unknown as FetchLike,
      ...overrides,
    }),
    fetchMock,
  };
}

describe("YunExpressClient", () => {
  test("initializes all 8 resource namespaces", () => {
    const { client } = createClient();

    expect(client.orders).toBeInstanceOf(OrdersResource);
    expect(client.labels).toBeInstanceOf(LabelsResource);
    expect(client.tracking).toBeInstanceOf(TrackingResource);
    expect(client.pricing).toBeInstanceOf(PricingResource);
    expect(client.exceptions).toBeInstanceOf(ExceptionsResource);
    expect(client.returns).toBeInstanceOf(ReturnsResource);
    expect(client.billing).toBeInstanceOf(BillingResource);
    expect(client.basic).toBeInstanceOf(BasicResource);
  });

  test("environment defaults to auth kind", () => {
    const { client } = createClient();
    expect(client.environment).toBe("sandbox");
  });

  test("baseUrl defaults to sandbox URL for sandbox auth", () => {
    const { client } = createClient();
    expect(client.baseUrl).toBe("https://openapi-sbx.yunexpress.cn");
  });

  test("baseUrl defaults to production URL for production auth", () => {
    const fetchMock = vi.fn(async () => jsonResponse({ success: true, result: null }));

    const client = new YunExpressClient({
      auth: {
        kind: "production",
        appId: "app",
        apiKey: "key",
        accessToken: "tok",
        signer: new NoopRequestSigner(),
      },
      fetch: fetchMock as unknown as FetchLike,
    });

    expect(client.baseUrl).toBe("https://openapi.yunexpress.cn");
    expect(client.environment).toBe("production");
  });

  test("custom baseUrl is used", () => {
    const { client } = createClient({
      baseUrl: "https://custom.api.com",
    });
    expect(client.baseUrl).toBe("https://custom.api.com");
  });

  test("trailing slash is stripped from baseUrl", () => {
    const { client } = createClient({
      baseUrl: "https://custom.api.com/",
    });
    expect(client.baseUrl).toBe("https://custom.api.com");
  });

  test("throws when environment does not match auth kind", () => {
    expect(() => {
      new YunExpressClient({
        auth: {
          kind: "sandbox",
          accessToken: "tok",
          signer: new NoopRequestSigner(),
        },
        environment: "production" as any,
        fetch: vi.fn() as unknown as FetchLike,
      });
    }).toThrow("does not match auth kind");
  });

  test("throws when global fetch is unavailable and not provided", () => {
    const originalFetch = globalThis.fetch;
    try {
      (globalThis as any).fetch = undefined;
      expect(() => {
        new YunExpressClient({
          auth: {
            kind: "sandbox",
            accessToken: "tok",
            signer: new NoopRequestSigner(),
          },
        });
      }).toThrow("fetch");
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  test("request() delegates to transport and returns TransportResponse", async () => {
    const { client, fetchMock } = createClient();
    fetchMock.mockResolvedValueOnce(
      jsonResponse({
        request_id: "req-1",
        success: true,
        result: { value: 42 },
      }),
    );

    const response = await client.request<{ value: number }>({
      method: "GET",
      path: "/v1/test",
    });

    expect(response.data.value).toBe(42);
    expect(response.requestId).toBe("req-1");
    expect(response.ok).toBe(true);
  });

  test("invoke() delegates to transport and returns unwrapped data", async () => {
    const { client, fetchMock } = createClient();
    fetchMock.mockResolvedValueOnce(
      jsonResponse({
        success: true,
        result: { items: [1, 2] },
      }),
    );

    const data = await client.invoke<{ items: number[] }>({
      method: "GET",
      path: "/v1/list",
    });

    expect(data.items).toEqual([1, 2]);
  });
});
