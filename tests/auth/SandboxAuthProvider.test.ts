import { describe, expect, test, vi } from "vite-plus/test";
import { SandboxAuthProvider } from "../../src/auth/providers/SandboxAuthProvider.ts";

describe("SandboxAuthProvider", () => {
  test("produces auth headers with a static access token", async () => {
    const provider = new SandboxAuthProvider({
      kind: "sandbox",
      accessToken: "sandbox-tok",
      sourceKey: "src-key",
      uatAccessKey: "uat-key",
      signer: { sign: ({ sourceKey, token }) => `${sourceKey}:${token}` },
    });

    const headers = await provider.getHeaders({
      environment: "sandbox",
      method: "POST",
      path: "/v1/order/package/create",
      url: "https://openapi-sbx.yunexpress.cn/v1/order/package/create",
      queryString: "",
      headers: {},
    });

    expect(headers.token).toBe("sandbox-tok");
    expect(headers.sign).toContain("src-key");
    expect(headers.sign).toContain("sandbox-tok");
    expect(headers.date).toMatch(/^\d+$/);
  });

  test("produces auth headers with a token provider", async () => {
    const tokenProvider = vi.fn(async (ctx: any) => {
      expect(ctx.sourceKey).toBe("s");
      expect(ctx.uatAccessKey).toBe("u");
      return "dynamic-sandbox-tok";
    });

    const provider = new SandboxAuthProvider({
      kind: "sandbox",
      tokenProvider,
      sourceKey: "s",
      uatAccessKey: "u",
      signer: { sign: () => "sig" },
    });

    const headers = await provider.getHeaders({
      environment: "sandbox",
      method: "GET",
      path: "/v1/test",
      url: "https://openapi-sbx.yunexpress.cn/v1/test",
      queryString: "",
      headers: {},
    });

    expect(headers.token).toBe("dynamic-sandbox-tok");
    expect(tokenProvider).toHaveBeenCalledTimes(1);
  });

  test("includes accept-language header when configured", async () => {
    const provider = new SandboxAuthProvider({
      kind: "sandbox",
      accessToken: "tok",
      acceptLanguage: "en-US",
      signer: { sign: () => "" },
    });

    const headers = await provider.getHeaders({
      environment: "sandbox",
      method: "GET",
      path: "/v1/test",
      url: "https://openapi-sbx.yunexpress.cn/v1/test",
      queryString: "",
      headers: {},
    });

    expect(headers["Accept-Language"]).toBe("en-US");
  });
});
