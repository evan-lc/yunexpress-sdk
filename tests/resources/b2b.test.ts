import { describe, expect, test, vi } from "vite-plus/test";
import { NoopRequestSigner } from "../../src/auth/signing/RequestSigner.ts";
import { YunExpressClient, type FetchLike } from "../../src/index.ts";
import { assertValidCreateB2BOrderRequest } from "../../src/resources/b2b/types.ts";

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

describe("assertValidCreateB2BOrderRequest", () => {
  test("passes with required top-level fields", () => {
    expect(() =>
      assertValidCreateB2BOrderRequest({
        productCode: "B2BUAT",
        countryCode: "US",
        currency: "USD",
        receiver: { countryCode: "US" },
        packages: [{ weight: 1.2 }],
        deliveryInfo: { deliveryType: 1 },
      }),
    ).not.toThrow();
  });

  test("rejects empty packages", () => {
    expect(() =>
      assertValidCreateB2BOrderRequest({
        productCode: "B2BUAT",
        countryCode: "US",
        currency: "USD",
        receiver: { countryCode: "US" },
        packages: [],
        deliveryInfo: { deliveryType: 1 },
      }),
    ).toThrow("at least one package");
  });
});

describe("B2BResource request construction", () => {
  test("createOrder sends POST with normalized B2B payload", async () => {
    const fetchMock = vi.fn(async (input: any, init: any) => {
      const url = new URL(
        typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url,
      );
      expect(url.pathname).toBe("/v1/order/b2b/create");
      expect(JSON.parse(init.body)).toEqual({
        customer_order_number: "B2B-001",
        product_code: "B2BUAT",
        country_code: "US",
        ein_number: "EIN123",
        import_company: "Importer Inc.",
        bond_expire_time: "2026-12-31T00:00:00Z",
        reference_id: "REF-1",
        goods_type: 1,
        currency: "USD",
        coupon_code: "PROMO",
        extra_services: [{ code: "SIG" }],
        receiver: {
          name: "Alice",
          country_code: "US",
          city: "Los Angeles",
          address_lines: ["1 Main St"],
          postal_code: "90001",
          phone_number: "+1-555",
        },
        packages: [
          {
            weight: 1.5,
            length: 20,
            width: 10,
            height: 8,
            box_number: "BOX-1",
            reference_id: "PKG-1",
            declaration_info: [
              {
                quantity: 1,
                unit_price: 10,
                unit_weight: 1.5,
                name_cn: "测试商品",
                name_en: "Test Item",
                hs_code: "1234",
                goods_url: "https://example.com/item",
                currency: "USD",
              },
            ],
          },
        ],
        delivery_info: {
          delivery_type: 1,
          collect_address: "Warehouse A",
          collect_starttime: "09:00",
          collect_endtime: "18:00",
        },
        source_code: "YT",
      });
      return jsonResponse({ success: true, result: { waybill_number: "YT-B2B-NEW" } });
    });

    const client = createClient(fetchMock);
    const response = await client.b2b.createOrder({
      customerOrderNumber: "B2B-001",
      productCode: "B2BUAT",
      countryCode: "US",
      einNumber: "EIN123",
      importCompany: "Importer Inc.",
      bondExpireTime: "2026-12-31T00:00:00Z",
      referenceId: "REF-1",
      goodsType: 1,
      currency: "USD",
      couponCode: "PROMO",
      extraServices: [{ code: "SIG" }],
      receiver: {
        name: "Alice",
        countryCode: "US",
        city: "Los Angeles",
        addressLines: ["1 Main St"],
        postalCode: "90001",
        phoneNumber: "+1-555",
      },
      packages: [
        {
          weight: 1.5,
          length: 20,
          width: 10,
          height: 8,
          boxNumber: "BOX-1",
          referenceId: "PKG-1",
          declarationInfo: [
            {
              quantity: 1,
              unitPrice: 10,
              unitWeight: 1.5,
              nameCn: "测试商品",
              nameEn: "Test Item",
              hsCode: "1234",
              goodsUrl: "https://example.com/item",
              currency: "USD",
            },
          ],
        },
      ],
      deliveryInfo: {
        deliveryType: 1,
        collectAddress: "Warehouse A",
        collectStartTime: "09:00",
        collectEndTime: "18:00",
      },
      sourceCode: "YT",
    });
    expect(response.data.waybill_number).toBe("YT-B2B-NEW");
  });

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

  test("cancelOrder sends POST with the official B2B cancel endpoint", async () => {
    const fetchMock = vi.fn(async (input: any, init: any) => {
      const url = new URL(
        typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url,
      );
      expect(url.pathname).toBe("/v1/order/b2b/cancel");
      expect(JSON.parse(init.body)).toEqual({ waybill_number: "WB-B2B-3" });
      return jsonResponse({ success: true, result: null });
    });

    const client = createClient(fetchMock);
    await client.b2b.cancelOrder({ waybillNumber: "WB-B2B-3" });
  });

  test("holdOrder sends POST with remark to the official B2B hold endpoint", async () => {
    const fetchMock = vi.fn(async (input: any, init: any) => {
      const url = new URL(
        typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url,
      );
      expect(url.pathname).toBe("/v1/order/b2b/hold");
      expect(JSON.parse(init.body)).toEqual({
        waybill_number: "WB-B2B-4",
        remark: "customer requested hold",
      });
      return jsonResponse({ success: true, result: null });
    });

    const client = createClient(fetchMock);
    await client.b2b.holdOrder({
      waybillNumber: "WB-B2B-4",
      remark: "customer requested hold",
    });
  });
});
