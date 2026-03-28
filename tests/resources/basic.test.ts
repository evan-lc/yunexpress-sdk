import { describe, expect, test, vi } from "vite-plus/test";
import { YunExpressClient, type FetchLike } from "../../src/index.ts";
import { NoopRequestSigner } from "../../src/auth/signing/RequestSigner.ts";

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

describe("BasicResource request construction", () => {
  test("getCountryCodes sends GET to /v1/basic/country/get", async () => {
    const fetchMock = vi.fn(async (input: any, init: any) => {
      const url = new URL(
        typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url,
      );
      expect(url.pathname).toBe("/v1/basic/country/get");
      expect(init.method).toBe("GET");
      return jsonResponse({
        success: true,
        result: [{ country_code: "US", country_name: "United States" }],
      });
    });

    const client = createClient(fetchMock);
    const res = await client.basic.getCountryCodes();
    expect(res.data).toHaveLength(1);
    expect(res.data[0]?.country_code).toBe("US");
  });

  test("getProducts sends GET to /v1/basic/product/get", async () => {
    const fetchMock = vi.fn(async (input: any, init: any) => {
      const url = new URL(
        typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url,
      );
      expect(url.pathname).toBe("/v1/basic/product/get");
      expect(init.method).toBe("GET");
      return jsonResponse({
        success: true,
        result: [{ product_code: "THZXR", product_name: "Test Product" }],
      });
    });

    const client = createClient(fetchMock);
    const res = await client.basic.getProducts();
    expect(res.data).toHaveLength(1);
    expect(res.data[0]?.product_code).toBe("THZXR");
  });
});
