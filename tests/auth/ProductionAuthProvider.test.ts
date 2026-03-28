import { describe, expect, test, vi } from "vite-plus/test";
import { ProductionAuthProvider } from "../../src/auth/providers/ProductionAuthProvider.ts";
import { NoopRequestSigner } from "../../src/auth/signing/RequestSigner.ts";
import type { AuthRequestContext } from "../../src/auth/AuthProvider.ts";

function makeContext(overrides: Partial<AuthRequestContext> = {}): AuthRequestContext {
  return {
    environment: "production",
    method: "GET",
    path: "/v1/order/info/get",
    url: "https://openapi.yunexpress.cn/v1/order/info/get",
    queryString: "",
    headers: {},
    ...overrides,
  };
}

function jsonResponse(body: unknown, init: ResponseInit = {}): Response {
  const headers = new Headers(init.headers);
  if (!headers.has("content-type")) {
    headers.set("content-type", "application/json");
  }
  return new Response(JSON.stringify(body), { ...init, headers });
}

describe("ProductionAuthProvider", () => {
  test("uses static accessToken when provided", async () => {
    const provider = new ProductionAuthProvider({
      kind: "production",
      appId: "app-1",
      apiKey: "key-1",
      accessToken: "static-prod-token",
      signer: new NoopRequestSigner(),
    });

    const headers = await provider.getHeaders(makeContext());

    expect(headers.token).toBe("static-prod-token");
    expect(headers.date).toMatch(/^\d+$/);
  });

  test("uses tokenProvider when provided", async () => {
    const tokenProvider = vi.fn(async (ctx: any) => {
      expect(ctx.appId).toBe("app-1");
      expect(ctx.apiKey).toBe("key-1");
      return "provider-prod-token";
    });

    const provider = new ProductionAuthProvider({
      kind: "production",
      appId: "app-1",
      apiKey: "key-1",
      tokenProvider,
      signer: new NoopRequestSigner(),
    });

    const headers = await provider.getHeaders(makeContext());

    expect(headers.token).toBe("provider-prod-token");
    expect(tokenProvider).toHaveBeenCalledTimes(1);
  });

  test("auto-exchanges OAuth2 token when neither accessToken nor tokenProvider", async () => {
    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url =
        typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url;

      if (url.includes("/openapi/oauth2/token")) {
        const body = JSON.parse(init?.body as string);
        expect(body.grantType).toBe("client_credentials");
        expect(body.appId).toBe("app-1");
        expect(body.appSecret).toBe("key-1");

        return jsonResponse({
          accessToken: "auto-exchanged-token",
          expiresIn: 7200,
        });
      }

      throw new Error(`Unexpected fetch to ${url}`);
    });

    const provider = new ProductionAuthProvider(
      {
        kind: "production",
        appId: "app-1",
        apiKey: "key-1",
        signer: new NoopRequestSigner(),
      },
      { fetch: fetchMock as any },
    );

    const headers = await provider.getHeaders(makeContext());
    expect(headers.token).toBe("auto-exchanged-token");
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  test("includes accept-language when configured", async () => {
    const provider = new ProductionAuthProvider({
      kind: "production",
      appId: "app-1",
      apiKey: "key-1",
      accessToken: "tok",
      signer: new NoopRequestSigner(),
      acceptLanguage: "zh-CN",
    });

    const headers = await provider.getHeaders(makeContext());
    expect(headers["Accept-Language"]).toBe("zh-CN");
  });
});
