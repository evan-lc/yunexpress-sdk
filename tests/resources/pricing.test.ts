import { describe, expect, test, vi } from "vite-plus/test";
import { YunExpressClient, type FetchLike } from "../../src/index.ts";
import { NoopRequestSigner } from "../../src/auth/signing/RequestSigner.ts";
import {
  assertValidGetPriceTrialRequest,
  assertValidGetPriceTrialV2Request,
} from "../../src/resources/pricing/types.ts";
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

describe("assertValidGetPriceTrialV2Request", () => {
  test("requires detailEntities for B2B income type", () => {
    expect(() =>
      assertValidGetPriceTrialV2Request({
        countryCode: "US",
        weight: 1.5,
        incomeType: "B2B",
      }),
    ).toThrow("detailEntities");
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

  test("getPriceTrialV2 sends POST with body payload", async () => {
    const fetchMock = vi.fn(async (input: any, init: any) => {
      const url = new URL(
        typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url,
      );
      expect(url.pathname).toBe("/v1/price-trial/get_V2");
      expect(JSON.parse(init.body)).toEqual({
        country_code: "US",
        weight: 10,
        weight_unit: "KG",
        package_type: "C",
        postal_code: "90001",
        product_group_code: "DH",
        pieces: 2,
        length: 20,
        width: 10,
        height: 8,
        size_unit: "CM",
        origin: "YT-SZ",
        income_type: "B2B",
        detail_entities: [{ box_no: "BOX-1", weight: 5 }],
      });
      return jsonResponse({ success: true, result: [{ product_code: "B2BUAT" }] });
    });

    const client = createClient(fetchMock);
    const response = await client.pricing.getPriceTrialV2({
      countryCode: "US",
      weight: 10,
      weightUnit: "KG",
      packageType: "C",
      postalCode: "90001",
      productGroupCode: "DH",
      pieces: 2,
      length: 20,
      width: 10,
      height: 8,
      sizeUnit: "CM",
      origin: "YT-SZ",
      incomeType: "B2B",
      detailEntities: [{ box_no: "BOX-1", weight: 5 }],
    });
    expect(response.data[0]?.product_code).toBe("B2BUAT");
  });
});
