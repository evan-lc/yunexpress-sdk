import { describe, expect, test, vi } from "vite-plus/test";
import {
  buildAuthHeaders,
  createAuthProvider,
  resolveAccessToken,
  type AccessTokenContext,
} from "../../src/auth/AuthProvider.ts";
import { SandboxAuthProvider } from "../../src/auth/providers/SandboxAuthProvider.ts";
import { ProductionAuthProvider } from "../../src/auth/providers/ProductionAuthProvider.ts";
import { NoopRequestSigner } from "../../src/auth/signing/RequestSigner.ts";
import type { RequestSigner } from "../../src/auth/signing/RequestSigner.ts";

function makeContext(overrides: Partial<AccessTokenContext> = {}): AccessTokenContext {
  return {
    environment: "sandbox",
    method: "GET",
    path: "/v1/test",
    url: "https://openapi-sbx.yunexpress.cn/v1/test",
    queryString: "",
    headers: {},
    ...overrides,
  };
}

describe("createAuthProvider", () => {
  test("returns SandboxAuthProvider for sandbox kind", () => {
    const provider = createAuthProvider("sandbox", {
      kind: "sandbox",
      accessToken: "tok",
    });
    expect(provider).toBeInstanceOf(SandboxAuthProvider);
  });

  test("returns ProductionAuthProvider for production kind", () => {
    const provider = createAuthProvider("production", {
      kind: "production",
      appId: "app",
      apiKey: "key",
      accessToken: "tok",
      signer: new NoopRequestSigner(),
    });
    expect(provider).toBeInstanceOf(ProductionAuthProvider);
  });

  test("throws when auth kind does not match environment", () => {
    expect(() =>
      createAuthProvider("production", {
        kind: "sandbox",
        accessToken: "tok",
      } as any),
    ).toThrow("does not match environment");
  });
});

describe("resolveAccessToken", () => {
  test("returns static accessToken when provided", async () => {
    const token = await resolveAccessToken({ accessToken: "static-token" }, makeContext());
    expect(token).toBe("static-token");
  });

  test("calls tokenProvider when no static accessToken", async () => {
    const provider = vi.fn(async () => "dynamic-token");
    const token = await resolveAccessToken({ tokenProvider: provider }, makeContext());
    expect(token).toBe("dynamic-token");
    expect(provider).toHaveBeenCalledTimes(1);
  });

  test("uses fallback provider when neither accessToken nor tokenProvider", async () => {
    const fallback = vi.fn(async () => "fallback-token");
    const token = await resolveAccessToken({}, makeContext(), fallback);
    expect(token).toBe("fallback-token");
  });

  test("throws when no token source is available", async () => {
    await expect(resolveAccessToken({}, makeContext())).rejects.toThrow(
      "access token or token provider",
    );
  });

  test("prefers accessToken over tokenProvider", async () => {
    const provider = vi.fn(async () => "provider-token");
    const token = await resolveAccessToken(
      { accessToken: "static", tokenProvider: provider } as any,
      makeContext(),
    );
    expect(token).toBe("static");
    expect(provider).not.toHaveBeenCalled();
  });
});

describe("buildAuthHeaders", () => {
  test("includes token, date, and sign headers", async () => {
    const signer: RequestSigner = { sign: () => "test-signature" };
    const headers = await buildAuthHeaders({
      context: makeContext(),
      token: "my-token",
      signer,
    });

    expect(headers.token).toBe("my-token");
    expect(headers.date).toMatch(/^\d+$/);
    expect(headers.sign).toBe("test-signature");
  });

  test("includes Accept-Language when acceptLanguage is provided", async () => {
    const signer: RequestSigner = { sign: () => "" };
    const headers = await buildAuthHeaders({
      context: makeContext(),
      token: "tok",
      signer,
      acceptLanguage: "zh-CN",
    });

    expect(headers["Accept-Language"]).toBe("zh-CN");
  });

  test("does not include Accept-Language when not provided", async () => {
    const signer: RequestSigner = { sign: () => "" };
    const headers = await buildAuthHeaders({
      context: makeContext(),
      token: "tok",
      signer,
    });

    expect(headers["Accept-Language"]).toBeUndefined();
  });

  test("uses NoopRequestSigner when no signer and no apiKey", async () => {
    const headers = await buildAuthHeaders({
      context: makeContext(),
      token: "tok",
    });

    expect(headers.sign).toBe("");
  });

  test("auto-creates HmacSha256RequestSigner when apiKey is in context", async () => {
    const headers = await buildAuthHeaders({
      context: makeContext({ apiKey: "secret" }),
      token: "tok",
    });

    // sign should be a non-empty base64 string
    expect(headers.sign).toBeTruthy();
    expect(headers.sign.length).toBeGreaterThan(0);
  });
});
