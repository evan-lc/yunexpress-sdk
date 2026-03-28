import { describe, expect, test, vi } from "vite-plus/test";
import { createOAuthAccessTokenProvider } from "../../src/auth/token/createOAuthAccessTokenProvider.ts";
import { AuthenticationError } from "../../src/errors/AuthenticationError.ts";
import { RequestExecutionError } from "../../src/errors/RequestExecutionError.ts";

function jsonResponse(body: unknown, init: ResponseInit = {}): Response {
  const headers = new Headers(init.headers);
  if (!headers.has("content-type")) {
    headers.set("content-type", "application/json");
  }
  return new Response(JSON.stringify(body), { ...init, headers });
}

const dummyContext: any = {
  environment: "production",
  method: "GET",
  path: "/v1/test",
  url: "https://openapi.yunexpress.cn/v1/test",
  queryString: "",
  headers: {},
};

describe("createOAuthAccessTokenProvider", () => {
  test("exchanges token with correct request body", async () => {
    const fetchMock = vi.fn(async (_url: any, init: any) => {
      const body = JSON.parse(init.body);
      expect(body).toEqual({
        grantType: "client_credentials",
        appId: "app-1",
        appSecret: "secret-1",
        sourceKey: "src-1",
      });
      return jsonResponse({ accessToken: "tok-1", expiresIn: 3600 });
    });

    const provider = createOAuthAccessTokenProvider({
      environment: "production",
      appId: "app-1",
      appSecret: "secret-1",
      sourceKey: "src-1",
      fetch: fetchMock as any,
    });

    const token = await provider(dummyContext);
    expect(token).toBe("tok-1");
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  test("omits sourceKey when not provided", async () => {
    const fetchMock = vi.fn(async (_url: any, init: any) => {
      const body = JSON.parse(init.body);
      expect(body).not.toHaveProperty("sourceKey");
      return jsonResponse({ accessToken: "tok", expiresIn: 7200 });
    });

    const provider = createOAuthAccessTokenProvider({
      environment: "production",
      appId: "app",
      appSecret: "secret",
      fetch: fetchMock as any,
    });

    await provider(dummyContext);
  });

  test("caches the token on subsequent calls", async () => {
    const fetchMock = vi.fn(async () =>
      jsonResponse({ accessToken: "cached-tok", expiresIn: 7200 }),
    );

    const provider = createOAuthAccessTokenProvider({
      environment: "production",
      appId: "app",
      appSecret: "secret",
      fetch: fetchMock as any,
    });

    const tok1 = await provider(dummyContext);
    const tok2 = await provider(dummyContext);

    expect(tok1).toBe("cached-tok");
    expect(tok2).toBe("cached-tok");
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  test("deduplicates concurrent exchange requests", async () => {
    let resolveExchange: (v: Response) => void;
    const pending = new Promise<Response>((resolve) => {
      resolveExchange = resolve;
    });

    const fetchMock = vi.fn(async () => pending);

    const provider = createOAuthAccessTokenProvider({
      environment: "production",
      appId: "app",
      appSecret: "secret",
      fetch: fetchMock as any,
    });

    const p1 = provider(dummyContext);
    const p2 = provider(dummyContext);

    resolveExchange!(jsonResponse({ accessToken: "dedup-tok", expiresIn: 7200 }));

    const [tok1, tok2] = await Promise.all([p1, p2]);
    expect(tok1).toBe("dedup-tok");
    expect(tok2).toBe("dedup-tok");
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  test("normalizes string expiresIn to number", async () => {
    const fetchMock = vi.fn(async () => jsonResponse({ accessToken: "tok", expiresIn: "3600" }));

    const provider = createOAuthAccessTokenProvider({
      environment: "production",
      appId: "app",
      appSecret: "secret",
      fetch: fetchMock as any,
    });

    const token = await provider(dummyContext);
    expect(token).toBe("tok");
  });

  test("uses default expiry when expiresIn is missing", async () => {
    const fetchMock = vi.fn(async () => jsonResponse({ accessToken: "tok" }));

    const provider = createOAuthAccessTokenProvider({
      environment: "production",
      appId: "app",
      appSecret: "secret",
      fetch: fetchMock as any,
    });

    const token = await provider(dummyContext);
    expect(token).toBe("tok");
  });

  test("throws AuthenticationError on non-OK response", async () => {
    const fetchMock = vi.fn(async () =>
      jsonResponse({ code: "INVALID_CREDENTIALS", msg: "bad creds" }, { status: 401 }),
    );

    const provider = createOAuthAccessTokenProvider({
      environment: "production",
      appId: "app",
      appSecret: "secret",
      fetch: fetchMock as any,
    });

    await expect(provider(dummyContext)).rejects.toBeInstanceOf(AuthenticationError);
  });

  test("throws AuthenticationError when response lacks accessToken", async () => {
    const fetchMock = vi.fn(async () => jsonResponse({ token: "wrong-field" }));

    const provider = createOAuthAccessTokenProvider({
      environment: "production",
      appId: "app",
      appSecret: "secret",
      fetch: fetchMock as any,
    });

    await expect(provider(dummyContext)).rejects.toBeInstanceOf(AuthenticationError);
  });

  test("throws RequestExecutionError on network failure", async () => {
    const fetchMock = vi.fn(async () => {
      throw new TypeError("fetch failed");
    });

    const provider = createOAuthAccessTokenProvider({
      environment: "production",
      appId: "app",
      appSecret: "secret",
      fetch: fetchMock as any,
    });

    await expect(provider(dummyContext)).rejects.toBeInstanceOf(RequestExecutionError);
  });

  test("uses custom tokenEndpoint when provided", async () => {
    const fetchMock = vi.fn(async (url: string) => {
      expect(url).toBe("https://custom.endpoint/token");
      return jsonResponse({ accessToken: "tok", expiresIn: 7200 });
    });

    const provider = createOAuthAccessTokenProvider({
      environment: "production",
      appId: "app",
      appSecret: "secret",
      tokenEndpoint: "https://custom.endpoint/token",
      fetch: fetchMock as any,
    });

    await provider(dummyContext);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  test("sends custom tokenHeaders", async () => {
    const fetchMock = vi.fn(async (_url: any, init: any) => {
      expect(init.headers["x-custom"]).toBe("value");
      return jsonResponse({ accessToken: "tok", expiresIn: 7200 });
    });

    const provider = createOAuthAccessTokenProvider({
      environment: "production",
      appId: "app",
      appSecret: "secret",
      tokenHeaders: { "x-custom": "value" },
      fetch: fetchMock as any,
    });

    await provider(dummyContext);
  });

  test("throws when global fetch is unavailable and no custom fetch", () => {
    const originalFetch = globalThis.fetch;
    try {
      (globalThis as any).fetch = undefined;
      expect(() =>
        createOAuthAccessTokenProvider({
          environment: "production",
          appId: "app",
          appSecret: "secret",
        }),
      ).toThrow("fetch");
    } finally {
      globalThis.fetch = originalFetch;
    }
  });
});
