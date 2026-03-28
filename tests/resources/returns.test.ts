import { describe, expect, test, vi } from "vite-plus/test";
import { YunExpressClient, type FetchLike } from "../../src/index.ts";
import { NoopRequestSigner } from "../../src/auth/signing/RequestSigner.ts";
import { assertValidCreateReturnOrderRequest } from "../../src/resources/returns/types.ts";
import { RequestExecutionError } from "../../src/errors/RequestExecutionError.ts";
import type { CreateReturnOrderRequest } from "../../src/resources/returns/types.ts";

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

function makeReturnRequest(
  overrides: Partial<CreateReturnOrderRequest> = {},
): CreateReturnOrderRequest {
  return {
    productCode: "PROD-1",
    handleCode: "RTQJ",
    warehouseCode: "WH-1",
    sendType: "RTSM",
    weight: 1.5,
    length: 20,
    width: 15,
    height: 10,
    sender: {
      name: "Alice",
      phoneNumber: "123456",
      countryCode: "US",
      province: "CA",
      city: "LA",
      addressLines: "123 Main St",
      postalCode: "90001",
    },
    goodsList: [{ nameLocal: "T-Shirt", quantity: 1 }],
    ...overrides,
  };
}

describe("assertValidCreateReturnOrderRequest", () => {
  test("passes with valid input", () => {
    expect(() => assertValidCreateReturnOrderRequest(makeReturnRequest())).not.toThrow();
  });

  test("rejects empty productCode", () => {
    expect(() =>
      assertValidCreateReturnOrderRequest(makeReturnRequest({ productCode: "  " })),
    ).toThrow("productCode is required");
  });

  test("rejects empty warehouseCode", () => {
    expect(() =>
      assertValidCreateReturnOrderRequest(makeReturnRequest({ warehouseCode: "  " })),
    ).toThrow("warehouseCode is required");
  });

  test("rejects weight below 0.01", () => {
    expect(() => assertValidCreateReturnOrderRequest(makeReturnRequest({ weight: 0.001 }))).toThrow(
      "between 0.01 and 1000",
    );
  });

  test("rejects weight above 1000", () => {
    expect(() => assertValidCreateReturnOrderRequest(makeReturnRequest({ weight: 1001 }))).toThrow(
      "between 0.01 and 1000",
    );
  });

  test("rejects empty goodsList", () => {
    expect(() => assertValidCreateReturnOrderRequest(makeReturnRequest({ goodsList: [] }))).toThrow(
      "at least one item",
    );
  });

  test("rejects missing sender.name", () => {
    expect(() =>
      assertValidCreateReturnOrderRequest(
        makeReturnRequest({
          sender: {
            name: "",
            phoneNumber: "123",
            countryCode: "US",
            province: "CA",
            city: "LA",
            addressLines: "addr",
            postalCode: "90001",
          },
        }),
      ),
    ).toThrow("sender.name is required");
  });

  test("rejects missing sender.countryCode", () => {
    expect(() =>
      assertValidCreateReturnOrderRequest(
        makeReturnRequest({
          sender: {
            name: "Alice",
            phoneNumber: "123",
            countryCode: " ",
            province: "CA",
            city: "LA",
            addressLines: "addr",
            postalCode: "90001",
          },
        }),
      ),
    ).toThrow("sender.countryCode is required");
  });

  test("throws RequestExecutionError", () => {
    let error: unknown;
    try {
      assertValidCreateReturnOrderRequest(makeReturnRequest({ productCode: " " }));
    } catch (e) {
      error = e;
    }
    expect(error).toBeInstanceOf(RequestExecutionError);
  });
});

describe("ReturnsResource request construction", () => {
  test("createReturnOrder sends POST with nested body", async () => {
    const fetchMock = vi.fn(async (input: any, init: any) => {
      const url = new URL(
        typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url,
      );
      expect(url.pathname).toBe("/v1/openapi/order/add");
      const body = JSON.parse(init.body);
      expect(body.product_code).toBe("PROD-1");
      expect(body.handle_code).toBe("RTQJ");
      expect(body.warehouse_code).toBe("WH-1");
      expect(body.sender.name).toBe("Alice");
      expect(body.sender.country_code).toBe("US");
      expect(body.goods_list).toHaveLength(1);
      expect(body.goods_list[0].name_local).toBe("T-Shirt");
      return jsonResponse({ success: true, result: { order_code: "RET-1" } });
    });

    const client = createClient(fetchMock);
    const res = await client.returns.createReturnOrder(makeReturnRequest());
    expect(res.data.order_code).toBe("RET-1");
  });

  test("includes receiver when provided", async () => {
    const fetchMock = vi.fn(async (_input: any, init: any) => {
      const body = JSON.parse(init.body);
      expect(body.receiver.name).toBe("Bob");
      expect(body.receiver.country_code).toBe("DE");
      return jsonResponse({ success: true, result: {} });
    });

    const client = createClient(fetchMock);
    await client.returns.createReturnOrder(
      makeReturnRequest({
        receiver: {
          name: "Bob",
          countryCode: "DE",
        },
      }),
    );
  });
});
