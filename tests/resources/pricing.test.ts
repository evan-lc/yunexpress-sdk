import { describe, expect, test, vi } from "vite-plus/test";
import { YunExpressClient, type FetchLike } from "../../src/index.ts";
import { NoopRequestSigner } from "../../src/auth/signing/RequestSigner.ts";
import { assertValidGetPriceTrialRequest } from "../../src/resources/pricing/types.ts";
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

describe("assertValidGetPriceTrialRequest", () => {
  test("passes with valid input", () => {
    expect(() => assertValidGetPriceTrialRequest({ countryCode: "US", weight: 1.5 })).not.toThrow();
  });

  test("rejects empty country code", () => {
    expect(() => assertValidGetPriceTrialRequest({ countryCode: "", weight: 1 })).toThrow(
      "2-letter",
    );
  });

  test("rejects country code that is not 2 letters", () => {
    expect(() => assertValidGetPriceTrialRequest({ countryCode: "USA", weight: 1 })).toThrow(
      "2-letter",
    );
  });

  test("rejects single letter country code", () => {
    expect(() => assertValidGetPriceTrialRequest({ countryCode: "U", weight: 1 })).toThrow(
      "2-letter",
    );
  });

  test("rejects weight below 0.001", () => {
    expect(() => assertValidGetPriceTrialRequest({ countryCode: "US", weight: 0.0001 })).toThrow(
      "between 0.001 and 1000",
    );
  });

  test("rejects weight above 1000", () => {
    expect(() => assertValidGetPriceTrialRequest({ countryCode: "US", weight: 1001 })).toThrow(
      "between 0.001 and 1000",
    );
  });

  test("rejects NaN weight", () => {
    expect(() => assertValidGetPriceTrialRequest({ countryCode: "US", weight: NaN })).toThrow(
      "between 0.001 and 1000",
    );
  });

  test("throws RequestExecutionError", () => {
    let error: unknown;
    try {
      assertValidGetPriceTrialRequest({ countryCode: "X", weight: 1 });
    } catch (e) {
      error = e;
    }
    expect(error).toBeInstanceOf(RequestExecutionError);
  });
});

describe("PricingResource request construction", () => {
  test("getPriceTrial sends GET with all query params", async () => {
    const fetchMock = vi.fn(async (input: any) => {
      const url = new URL(
        typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url,
      );
      expect(url.pathname).toBe("/v1/price-trial/get");
      expect(url.searchParams.get("country_code")).toBe("BR");
      expect(url.searchParams.get("weight")).toBe("2.5");
      expect(url.searchParams.get("weight_unit")).toBe("KG");
      expect(url.searchParams.get("package_type")).toBe("C");
      expect(url.searchParams.get("postal_code")).toBe("12345");
      return jsonResponse({ success: true, result: [] });
    });

    const client = createClient(fetchMock);
    await client.pricing.getPriceTrial({
      countryCode: "BR",
      weight: 2.5,
      weightUnit: "KG",
      packageType: "C",
      postalCode: "12345",
    });
  });
});
