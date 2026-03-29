import { describe, expect, test, vi } from "vite-plus/test";
import { NoopRequestSigner } from "../../src/auth/signing/RequestSigner.ts";
import { YunExpressClient, type FetchLike } from "../../src/index.ts";

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

describe("B2BResource request construction", () => {
  test("getWaybillDetail sends GET to the official B2B detail endpoint", async () => {
    const fetchMock = vi.fn(async (input: any) => {
      const url = new URL(
        typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url,
      );
      expect(url.pathname).toBe("/v1/order/b2b/info/get");
      expect(url.searchParams.get("order_number")).toBe("YT-B2B-1");
      return jsonResponse({ success: true, result: { waybill_number: "YT-B2B-1" } });
    });

    const client = createClient(fetchMock);
    const response = await client.b2b.getWaybillDetail({ orderNumber: "YT-B2B-1" });
    expect(response.data.waybill_number).toBe("YT-B2B-1");
  });

  test("getLabel sends GET to the official B2B label endpoint", async () => {
    const fetchMock = vi.fn(async (input: any) => {
      const url = new URL(
        typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url,
      );
      expect(url.pathname).toBe("/v1/order/b2b/label/get");
      expect(url.searchParams.get("order_number")).toBe("YT-B2B-2");
      return jsonResponse({ success: true, result: { url: "https://label.test/b2b.pdf" } });
    });

    const client = createClient(fetchMock);
    const response = await client.b2b.getLabel({ orderNumber: "YT-B2B-2" });
    expect(response.data.url).toContain("b2b.pdf");
  });

  test("getLastMileCarriers normalizes carriers from nested result", async () => {
    const fetchMock = vi.fn(async (input: any, init: any) => {
      const url = new URL(
        typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url,
      );
      expect(url.pathname).toBe("/v1/order/b2b/last-mile/get");
      const body = JSON.parse(init.body);
      expect(body.waybill_numbers).toEqual(["WB-B2B-1"]);
      return jsonResponse({
        success: true,
        result: {
          carriers: [{ waybill_number: "WB-B2B-1", last_mile_name: "Carrier" }],
        },
      });
    });

    const client = createClient(fetchMock);
    const response = await client.b2b.getLastMileCarriers({ waybillNumbers: ["WB-B2B-1"] });
    expect(response.data).toHaveLength(1);
    expect(response.data[0]?.last_mile_name).toBe("Carrier");
  });

  test("getProducts reads the official detail payload", async () => {
    const fetchMock = vi.fn(async (input: any) => {
      const url = new URL(
        typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url,
      );
      expect(url.pathname).toBe("/v1/basic-data/b2b/products/getlist");
      expect(url.searchParams.get("country_code")).toBe("US");
      return jsonResponse({
        success: true,
        detail: [{ product_code: "B2BUAT", product_name: "B2B Test" }],
      });
    });

    const client = createClient(fetchMock);
    const response = await client.b2b.getProducts({ countryCode: "US" });
    expect(response.data[0]?.product_code).toBe("B2BUAT");
  });

  test("getSecondaryAddressTypes returns array results", async () => {
    const fetchMock = vi.fn(async (input: any) => {
      const url = new URL(
        typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url,
      );
      expect(url.pathname).toBe("/v1/warehouse/b2b/category/get");
      return jsonResponse({ success: true, result: [{ id: 1, name: "Storage" }] });
    });

    const client = createClient(fetchMock);
    const response = await client.b2b.getSecondaryAddressTypes();
    expect(response.data[0]?.name).toBe("Storage");
  });

  test("getWarehouseAddresses forwards optional filters", async () => {
    const fetchMock = vi.fn(async (input: any) => {
      const url = new URL(
        typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url,
      );
      expect(url.pathname).toBe("/v1/warehouse/b2b/address/get");
      expect(url.searchParams.get("address_type")).toBe("2");
      expect(url.searchParams.get("secondary_address_type")).toBe("7");
      expect(url.searchParams.get("country_code")).toBe("US");
      return jsonResponse({ success: true, result: [{ warehouse_code: "EWR4" }] });
    });

    const client = createClient(fetchMock);
    const response = await client.b2b.getWarehouseAddresses({
      addressType: 2,
      secondaryAddressType: 7,
      countryCode: "US",
    });
    expect(response.data[0]?.warehouse_code).toBe("EWR4");
  });

  test("getSelfWarehouses reads the detail payload", async () => {
    const fetchMock = vi.fn(async (input: any) => {
      const url = new URL(
        typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url,
      );
      expect(url.pathname).toBe("/v1/basic-data/b2b/products/getselfwarehouses");
      expect(url.searchParams.get("product_code")).toBe("B2BUAT");
      return jsonResponse({ success: true, detail: [{ code: "CN0004", name: "Shenzhen" }] });
    });

    const client = createClient(fetchMock);
    const response = await client.b2b.getSelfWarehouses({ productCode: "B2BUAT" });
    expect(response.data[0]?.code).toBe("CN0004");
  });

  test("getCollectWarehouses returns result arrays", async () => {
    const fetchMock = vi.fn(async (input: any) => {
      const url = new URL(
        typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url,
      );
      expect(url.pathname).toBe("/api/warehouse-info/get");
      return jsonResponse({
        code: 4100001,
        success: true,
        result: [{ collect_address_code: "W005948", collect_address_name: "Warehouse 1" }],
      });
    });

    const client = createClient(fetchMock);
    const response = await client.b2b.getCollectWarehouses();
    expect(response.data[0]?.collect_address_code).toBe("W005948");
  });
});
