import { describe, expect, test, vi } from "vite-plus/test";
import { YunExpressClient, type FetchLike, type CreatePackageRequest } from "../../src/index.ts";
import { NoopRequestSigner } from "../../src/auth/signing/RequestSigner.ts";
import { RequestExecutionError } from "../../src/errors/RequestExecutionError.ts";
import {
  assertValidCreatePackageRequest,
  assertValidGetWaybillDetailRequest,
  assertValidGetSenderRequest,
  assertValidGetLastMileCarriersRequest,
  assertValidModifyWeightRequest,
  assertValidCancelOrderRequest,
  assertValidHoldOrderRequest,
  assertValidGetPickupPointsRequest,
} from "../../src/resources/orders/types.ts";

function jsonResponse(body: unknown): Response {
  return new Response(JSON.stringify(body), {
    headers: { "content-type": "application/json" },
  });
}

function createClient(fetchMock?: ReturnType<typeof vi.fn>) {
  const mock = fetchMock ?? vi.fn(async () => jsonResponse({ success: true, result: {} }));
  return new YunExpressClient({
    auth: { kind: "sandbox", accessToken: "tok", signer: new NoopRequestSigner() },
    fetch: mock as unknown as FetchLike,
  });
}

function makePackageRequest(overrides: Partial<CreatePackageRequest> = {}): CreatePackageRequest {
  return {
    productCode: "STANDARD",
    customerOrderNumber: "ORDER-1",
    weightUnit: "KG",
    sizeUnit: "CM",
    packages: [{ weight: 1.25, length: 20, width: 15, height: 10 }],
    receiver: { name: "Alice", countryCode: "US", addressLine1: "1 Main St" },
    declarationInfo: [{ name: "T-Shirt", quantity: 1, declaredValue: 10, currency: "USD" }],
    ...overrides,
  };
}

describe("assertValidCreatePackageRequest", () => {
  test("passes with valid input", () => {
    expect(() => assertValidCreatePackageRequest(makePackageRequest())).not.toThrow();
  });

  test("rejects empty productCode", () => {
    expect(() =>
      assertValidCreatePackageRequest(makePackageRequest({ productCode: "  " })),
    ).toThrow("productCode is required");
  });

  test("rejects empty customerOrderNumber", () => {
    expect(() =>
      assertValidCreatePackageRequest(makePackageRequest({ customerOrderNumber: "  " })),
    ).toThrow("customerOrderNumber is required");
  });

  test("rejects empty packages array", () => {
    expect(() => assertValidCreatePackageRequest(makePackageRequest({ packages: [] }))).toThrow(
      "at least one package",
    );
  });

  test("rejects empty declarationInfo array", () => {
    expect(() =>
      assertValidCreatePackageRequest(makePackageRequest({ declarationInfo: [] })),
    ).toThrow("at least one declaration");
  });

  test("rejects weight <= 0", () => {
    expect(() =>
      assertValidCreatePackageRequest(makePackageRequest({ packages: [{ weight: 0 }] })),
    ).toThrow("greater than 0");
  });

  test("rejects negative weight", () => {
    expect(() =>
      assertValidCreatePackageRequest(makePackageRequest({ packages: [{ weight: -1 }] })),
    ).toThrow("greater than 0");
  });

  test("rejects weight with more than 3 decimal places", () => {
    expect(() =>
      assertValidCreatePackageRequest(makePackageRequest({ packages: [{ weight: 1.2345 }] })),
    ).toThrow("3 decimal places");
  });

  test("accepts weight with exactly 3 decimal places", () => {
    expect(() =>
      assertValidCreatePackageRequest(makePackageRequest({ packages: [{ weight: 1.234 }] })),
    ).not.toThrow();
  });

  test("rejects NaN weight", () => {
    expect(() =>
      assertValidCreatePackageRequest(makePackageRequest({ packages: [{ weight: NaN }] })),
    ).toThrow();
  });

  test("throws RequestExecutionError", () => {
    let error: unknown;
    try {
      assertValidCreatePackageRequest(makePackageRequest({ productCode: " " }));
    } catch (e) {
      error = e;
    }
    expect(error).toBeInstanceOf(RequestExecutionError);
  });
});

describe("assertValidGetWaybillDetailRequest", () => {
  test("passes with valid order number", () => {
    expect(() => assertValidGetWaybillDetailRequest({ orderNumber: "YT123" })).not.toThrow();
  });

  test("rejects empty order number", () => {
    expect(() => assertValidGetWaybillDetailRequest({ orderNumber: "" })).toThrow("required");
  });

  test("rejects whitespace-only order number", () => {
    expect(() => assertValidGetWaybillDetailRequest({ orderNumber: "   " })).toThrow("required");
  });

  test("rejects order number longer than 50 chars", () => {
    expect(() => assertValidGetWaybillDetailRequest({ orderNumber: "A".repeat(51) })).toThrow(
      "50 characters",
    );
  });

  test("accepts order number of exactly 50 chars", () => {
    expect(() => assertValidGetWaybillDetailRequest({ orderNumber: "A".repeat(50) })).not.toThrow();
  });
});

describe("assertValidGetSenderRequest", () => {
  test("rejects empty order number", () => {
    expect(() => assertValidGetSenderRequest({ orderNumber: "" })).toThrow("required");
  });
});

describe("assertValidGetLastMileCarriersRequest", () => {
  test("passes with valid waybill numbers", () => {
    expect(() => assertValidGetLastMileCarriersRequest({ waybillNumbers: ["WB1"] })).not.toThrow();
  });

  test("rejects empty array", () => {
    expect(() => assertValidGetLastMileCarriersRequest({ waybillNumbers: [] })).toThrow(
      "at least one",
    );
  });

  test("rejects more than 20 waybill numbers", () => {
    const numbers = Array.from({ length: 21 }, (_, i) => `WB${i}`);
    expect(() => assertValidGetLastMileCarriersRequest({ waybillNumbers: numbers })).toThrow(
      "at most 20",
    );
  });

  test("accepts exactly 20 waybill numbers", () => {
    const numbers = Array.from({ length: 20 }, (_, i) => `WB${i}`);
    expect(() => assertValidGetLastMileCarriersRequest({ waybillNumbers: numbers })).not.toThrow();
  });
});

describe("assertValidModifyWeightRequest", () => {
  test("passes with valid input", () => {
    expect(() =>
      assertValidModifyWeightRequest({ waybillNumber: "WB1", weight: 1.5 }),
    ).not.toThrow();
  });

  test("rejects empty waybill number", () => {
    expect(() => assertValidModifyWeightRequest({ waybillNumber: "", weight: 1 })).toThrow(
      "required",
    );
  });

  test("rejects weight below 0.001", () => {
    expect(() => assertValidModifyWeightRequest({ waybillNumber: "WB1", weight: 0.0001 })).toThrow(
      "between 0.001 and 1000",
    );
  });

  test("rejects weight above 1000", () => {
    expect(() => assertValidModifyWeightRequest({ waybillNumber: "WB1", weight: 1001 })).toThrow(
      "between 0.001 and 1000",
    );
  });
});

describe("assertValidCancelOrderRequest", () => {
  test("rejects empty waybill number", () => {
    expect(() => assertValidCancelOrderRequest({ waybillNumber: "" })).toThrow("required");
  });
});

describe("assertValidHoldOrderRequest", () => {
  test("passes with valid input", () => {
    expect(() => assertValidHoldOrderRequest({ waybillNumber: "WB1" })).not.toThrow();
  });

  test("rejects remark longer than 255 chars", () => {
    expect(() =>
      assertValidHoldOrderRequest({ waybillNumber: "WB1", remark: "a".repeat(256) }),
    ).toThrow("255 characters");
  });

  test("accepts remark of exactly 255 chars", () => {
    expect(() =>
      assertValidHoldOrderRequest({ waybillNumber: "WB1", remark: "a".repeat(255) }),
    ).not.toThrow();
  });
});

describe("assertValidGetPickupPointsRequest", () => {
  test("passes with valid country code", () => {
    expect(() => assertValidGetPickupPointsRequest({ countryCode: "US" })).not.toThrow();
  });

  test("rejects empty country code", () => {
    expect(() => assertValidGetPickupPointsRequest({ countryCode: " " })).toThrow("required");
  });
});

describe("OrdersResource request construction", () => {
  test("createPackage sends POST to correct path", async () => {
    const fetchMock = vi.fn(async (input: any, init: any) => {
      const url =
        typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url;
      expect(url).toContain("/v1/order/package/create");
      expect(init.method).toBe("POST");
      const body = JSON.parse(init.body);
      expect(body.customerOrderNumber).toBe("ORDER-1");
      return jsonResponse({ success: true, result: { waybillNumber: "WB1" } });
    });

    const client = createClient(fetchMock);
    const res = await client.orders.createPackage(makePackageRequest());
    expect(res.data.waybillNumber).toBe("WB1");
  });

  test("getWaybillDetail sends GET with order_number query param", async () => {
    const fetchMock = vi.fn(async (input: any) => {
      const url = new URL(
        typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url,
      );
      expect(url.pathname).toBe("/v1/order/info/get");
      expect(url.searchParams.get("order_number")).toBe("YT123");
      return jsonResponse({ success: true, result: { waybill_number: "WB1" } });
    });

    const client = createClient(fetchMock);
    await client.orders.getWaybillDetail({ orderNumber: "YT123" });
  });

  test("getSender sends GET with order_number query param", async () => {
    const fetchMock = vi.fn(async (input: any) => {
      const url = new URL(
        typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url,
      );
      expect(url.pathname).toBe("/v1/order/sender/get");
      expect(url.searchParams.get("order_number")).toBe("YT123");
      return jsonResponse({ success: true, result: {} });
    });

    const client = createClient(fetchMock);
    await client.orders.getSender({ orderNumber: "YT123" });
  });

  test("getLastMileCarriers sends POST with waybill_numbers body", async () => {
    const fetchMock = vi.fn(async (_input: any, init: any) => {
      const body = JSON.parse(init.body);
      expect(body.waybill_numbers).toEqual(["WB1", "WB2"]);
      return jsonResponse({ success: true, result: [] });
    });

    const client = createClient(fetchMock);
    await client.orders.getLastMileCarriers({ waybillNumbers: ["WB1", "WB2"] });
  });

  test("modifyWeight sends POST with correct body", async () => {
    const fetchMock = vi.fn(async (_input: any, init: any) => {
      const body = JSON.parse(init.body);
      expect(body.waybill_number).toBe("WB1");
      expect(body.weight).toBe(2.5);
      expect(body.weight_unit).toBe("KG");
      return jsonResponse({ success: true, result: null });
    });

    const client = createClient(fetchMock);
    await client.orders.modifyWeight({ waybillNumber: "WB1", weight: 2.5 });
  });

  test("cancelOrder sends POST with waybill_number body", async () => {
    const fetchMock = vi.fn(async (_input: any, init: any) => {
      const body = JSON.parse(init.body);
      expect(body.waybill_number).toBe("WB1");
      return jsonResponse({ success: true, result: null });
    });

    const client = createClient(fetchMock);
    await client.orders.cancelOrder({ waybillNumber: "WB1" });
  });

  test("holdOrder sends POST with waybill_number and remark", async () => {
    const fetchMock = vi.fn(async (_input: any, init: any) => {
      const body = JSON.parse(init.body);
      expect(body.waybill_number).toBe("WB1");
      expect(body.remark).toBe("hold reason");
      return jsonResponse({ success: true, result: null });
    });

    const client = createClient(fetchMock);
    await client.orders.holdOrder({ waybillNumber: "WB1", remark: "hold reason" });
  });

  test("getPickupPoints sends POST with country_code body", async () => {
    const fetchMock = vi.fn(async (_input: any, init: any) => {
      const body = JSON.parse(init.body);
      expect(body.country_code).toBe("BR");
      return jsonResponse({ success: true, result: [] });
    });

    const client = createClient(fetchMock);
    await client.orders.getPickupPoints({ countryCode: "BR" });
  });
});
