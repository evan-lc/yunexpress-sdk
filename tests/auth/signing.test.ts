import { createHmac } from "node:crypto";
import { describe, expect, test } from "vite-plus/test";
import { HmacSha256RequestSigner } from "../../src/auth/signing/HmacSha256RequestSigner.ts";
import { NoopRequestSigner } from "../../src/auth/signing/RequestSigner.ts";
import type { SignerContext } from "../../src/auth/signing/RequestSigner.ts";

function makeContext(overrides: Partial<SignerContext> = {}): SignerContext {
  return {
    environment: "production",
    method: "GET",
    path: "/v1/order/info/get",
    url: "https://openapi.yunexpress.cn/v1/order/info/get",
    queryString: "",
    headers: {},
    token: "test-token",
    date: "1711612800000",
    ...overrides,
  };
}

describe("HmacSha256RequestSigner", () => {
  test("produces correct HMAC-SHA256 for GET without body", () => {
    const signer = new HmacSha256RequestSigner("my-secret");
    const ctx = makeContext();

    const result = signer.sign(ctx);

    const expected = createHmac("sha256", "my-secret")
      .update("date=1711612800000&method=GET&uri=/v1/order/info/get")
      .digest("base64");

    expect(result).toBe(expected);
  });

  test("includes body in signature when bodyText is present", () => {
    const signer = new HmacSha256RequestSigner("secret-key");
    const body = JSON.stringify({ order: "123" });
    const ctx = makeContext({
      method: "POST",
      path: "/v1/order/package/create",
      bodyText: body,
    });

    const result = signer.sign(ctx);

    const expected = createHmac("sha256", "secret-key")
      .update(`body=${body}&date=1711612800000&method=POST&uri=/v1/order/package/create`)
      .digest("base64");

    expect(result).toBe(expected);
  });

  test("omits body part when bodyText is undefined", () => {
    const signer = new HmacSha256RequestSigner("key");
    const ctx = makeContext({ bodyText: undefined });

    const result = signer.sign(ctx);

    const expected = createHmac("sha256", "key")
      .update("date=1711612800000&method=GET&uri=/v1/order/info/get")
      .digest("base64");

    expect(result).toBe(expected);
  });

  test("uses the path field for uri component", () => {
    const signer = new HmacSha256RequestSigner("k");
    const ctx = makeContext({ path: "/v1/custom/path" });

    const result = signer.sign(ctx);

    const expected = createHmac("sha256", "k")
      .update("date=1711612800000&method=GET&uri=/v1/custom/path")
      .digest("base64");

    expect(result).toBe(expected);
  });

  test("handles DELETE method", () => {
    const signer = new HmacSha256RequestSigner("s");
    const ctx = makeContext({ method: "DELETE", path: "/v1/resource" });

    const result = signer.sign(ctx);

    const expected = createHmac("sha256", "s")
      .update("date=1711612800000&method=DELETE&uri=/v1/resource")
      .digest("base64");

    expect(result).toBe(expected);
  });
});

describe("NoopRequestSigner", () => {
  test("returns an empty string", () => {
    const signer = new NoopRequestSigner();
    const result = signer.sign();
    expect(result).toBe("");
  });
});
