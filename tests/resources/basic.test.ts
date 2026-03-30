import { describe, expect, test, vi } from "vite-plus/test";
import { YunExpressClient, type FetchLike } from "../../src/index.ts";
import { NoopRequestSigner } from "../../src/auth/signing/RequestSigner.ts";
import {
  assertValidRegisterIossRequest,
  assertValidRegisterVatRequest,
} from "../../src/resources/basic/types.ts";

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

describe("basic validators", () => {
  test("registerIoss requires platformName for platform registrations", () => {
    expect(() =>
      assertValidRegisterIossRequest({
        iossNumber: "IM1234567890",
        iossType: "P",
      }),
    ).toThrow("platformName");
  });

  test("registerVat requires importerAddress", () => {
    expect(() =>
      assertValidRegisterVatRequest({
        vatNumber: "VAT123",
        eoriNumber: "EORI123",
        countryCode: "DE",
        importerName: "Importer",
        importerAddress: "",
      }),
    ).toThrow("importerAddress");
  });
});

describe("BasicResource request construction", () => {
  test("getCountryCodes sends GET to /v1/basic-data/countries/getlist and normalizes list payloads", async () => {
    const fetchMock = vi.fn(async (input: any, init: any) => {
      const url = new URL(
        typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url,
      );
      expect(url.pathname).toBe("/v1/basic-data/countries/getlist");
      expect(init.method).toBe("GET");
      return jsonResponse({
        success: true,
        result: { list: [{ country_code: "US", country_name: "United States" }] },
      });
    });

    const client = createClient(fetchMock);
    const res = await client.basic.getCountryCodes();
    expect(res.data).toHaveLength(1);
    expect(res.data[0]?.country_code).toBe("US");
  });

  test("getProducts sends GET to /v1/basic-data/products/getlist and normalizes detail payloads", async () => {
    const fetchMock = vi.fn(async (input: any, init: any) => {
      const url = new URL(
        typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url,
      );
      expect(url.pathname).toBe("/v1/basic-data/products/getlist");
      expect(url.searchParams.get("country_code")).toBe("US");
      expect(init.method).toBe("GET");
      return jsonResponse({
        success: true,
        detail: [{ product_code: "THZXR", product_name: "Test Product" }],
      });
    });

    const client = createClient(fetchMock);
    const res = await client.basic.getProducts({ countryCode: "US" });
    expect(res.data).toHaveLength(1);
    expect(res.data[0]?.product_code).toBe("THZXR");
  });

  test("registerIoss sends POST with normalized body", async () => {
    const fetchMock = vi.fn(async (input: any, init: any) => {
      const url = new URL(
        typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url,
      );
      expect(url.pathname).toBe("/v1/precondition-service/ioss/register");
      expect(init.method).toBe("POST");
      expect(JSON.parse(init.body)).toEqual({
        ioss_number: "IM1234567890",
        ioss_type: "P",
        platform_name: "Shopify",
        ioss_name: "EU IOSS",
        company: "Importer Co",
        country_code: "DE",
        street: "Street 1",
        city: "Berlin",
        province: "BE",
        postal_code: "10115",
        phone_number: "123456",
        email: "ops@example.com",
        file_url: ["https://example.com/doc.pdf"],
      });
      return jsonResponse({ success: true, result: null });
    });

    const client = createClient(fetchMock);
    await client.basic.registerIoss({
      iossNumber: "IM1234567890",
      iossType: "P",
      platformName: "Shopify",
      iossName: "EU IOSS",
      company: "Importer Co",
      countryCode: "DE",
      street: "Street 1",
      city: "Berlin",
      province: "BE",
      postalCode: "10115",
      phoneNumber: "123456",
      email: "ops@example.com",
      fileUrls: ["https://example.com/doc.pdf"],
    });
  });

  test("registerVat sends POST with normalized body", async () => {
    const fetchMock = vi.fn(async (input: any, init: any) => {
      const url = new URL(
        typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url,
      );
      expect(url.pathname).toBe("/v1/precondition-service/vat/register");
      expect(init.method).toBe("POST");
      expect(JSON.parse(init.body)).toEqual({
        vat_number: "VAT123",
        eori_number: "EORI123",
        country_code: "DE",
        importer_name: "Importer GmbH",
        importer_address: "Street 1, Berlin",
      });
      return jsonResponse({ success: true, result: null });
    });

    const client = createClient(fetchMock);
    await client.basic.registerVat({
      vatNumber: "VAT123",
      eoriNumber: "EORI123",
      countryCode: "DE",
      importerName: "Importer GmbH",
      importerAddress: "Street 1, Berlin",
    });
  });
});
