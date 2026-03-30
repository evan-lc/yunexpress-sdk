import { describe, expect, test, vi } from "vite-plus/test";
import { YunExpressClient, type FetchLike } from "../../src/index.ts";
import { NoopRequestSigner } from "../../src/auth/signing/RequestSigner.ts";
import {
  assertValidChangeIssueWaybillNumberRequest,
  assertValidModifyIssueDeclarationInfoRequest,
  assertValidRetryIssueDeliveryRequest,
  assertValidReleaseIssueRequest,
  assertValidSupplyIssueReturnRequest,
} from "../../src/resources/exceptions/types.ts";
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

describe("assertValidReleaseIssueRequest", () => {
  test("passes with valid input", () => {
    expect(() => assertValidReleaseIssueRequest({ waybillNumber: "WB1" })).not.toThrow();
  });

  test("rejects empty waybill number", () => {
    expect(() => assertValidReleaseIssueRequest({ waybillNumber: "" })).toThrow("required");
  });

  test("rejects whitespace-only waybill number", () => {
    expect(() => assertValidReleaseIssueRequest({ waybillNumber: "   " })).toThrow("required");
  });

  test("rejects waybill number > 50 chars", () => {
    expect(() => assertValidReleaseIssueRequest({ waybillNumber: "W".repeat(51) })).toThrow(
      "50 characters",
    );
  });

  test("rejects remark > 255 chars", () => {
    expect(() =>
      assertValidReleaseIssueRequest({ waybillNumber: "WB1", remark: "r".repeat(256) }),
    ).toThrow("255 characters");
  });

  test("accepts remark of exactly 255 chars", () => {
    expect(() =>
      assertValidReleaseIssueRequest({ waybillNumber: "WB1", remark: "r".repeat(255) }),
    ).not.toThrow();
  });

  test("rejects newWaybillNumbers > 100 items", () => {
    const numbers = Array.from({ length: 101 }, (_, i) => `WB${i}`);
    expect(() =>
      assertValidReleaseIssueRequest({ waybillNumber: "WB1", newWaybillNumbers: numbers }),
    ).toThrow("at most 100");
  });

  test("rejects split and merge codes together", () => {
    expect(() =>
      assertValidReleaseIssueRequest({
        waybillNumber: "WB1",
        extraCodes: ["204", "205"],
      }),
    ).toThrow("mutually exclusive");
  });

  test("allows split code alone", () => {
    expect(() =>
      assertValidReleaseIssueRequest({
        waybillNumber: "WB1",
        extraCodes: ["205"],
      }),
    ).not.toThrow();
  });

  test("allows merge code alone", () => {
    expect(() =>
      assertValidReleaseIssueRequest({
        waybillNumber: "WB1",
        extraCodes: ["204"],
      }),
    ).not.toThrow();
  });

  test("allows other codes like 203 and 206 together", () => {
    expect(() =>
      assertValidReleaseIssueRequest({
        waybillNumber: "WB1",
        extraCodes: ["203", "206"],
      }),
    ).not.toThrow();
  });

  test("throws RequestExecutionError", () => {
    let error: unknown;
    try {
      assertValidReleaseIssueRequest({ waybillNumber: "" });
    } catch (e) {
      error = e;
    }
    expect(error).toBeInstanceOf(RequestExecutionError);
  });
});

describe("assertValidModifyIssueDeclarationInfoRequest", () => {
  test("passes with valid input", () => {
    expect(() =>
      assertValidModifyIssueDeclarationInfoRequest({
        waybillNumber: "WB5",
        declarationInfo: [{ declarationId: "2007502477338910720", nameLocal: "速溶咖啡" }],
      }),
    ).not.toThrow();
  });

  test("rejects empty declarationInfo array", () => {
    expect(() =>
      assertValidModifyIssueDeclarationInfoRequest({
        waybillNumber: "WB5",
        declarationInfo: [],
      }),
    ).toThrow("at least one declaration item");
  });

  test("rejects missing declarationId", () => {
    expect(() =>
      assertValidModifyIssueDeclarationInfoRequest({
        waybillNumber: "WB5",
        declarationInfo: [{ declarationId: "   " }],
      }),
    ).toThrow("declarationInfo[0].declarationId is required");
  });
});

describe("additional exception validators", () => {
  test("changeWaybillNumber requires newWaybillNumber when changeNumberType is 0", () => {
    expect(() =>
      assertValidChangeIssueWaybillNumberRequest({
        waybillNumber: "WB6",
        changeNumberType: 0,
        issueType: 1,
      }),
    ).toThrow("newWaybillNumber is required");
  });

  test("supplyReturn requires matching nested info for returnType", () => {
    expect(() =>
      assertValidSupplyIssueReturnRequest({
        waybillNumber: "WB7",
        returnType: 2,
      }),
    ).toThrow("cashOnDelivery is required");
  });

  test("retryDelivery requires receiver for retryType 2", () => {
    expect(() =>
      assertValidRetryIssueDeliveryRequest({
        waybillNumber: "WB8",
        retryType: 2,
      }),
    ).toThrow("receiver is required");
  });
});

describe("ExceptionsResource request construction", () => {
  test("getReceiveAddresses sends GET to the official endpoint", async () => {
    const fetchMock = vi.fn(async (input: any, init: any) => {
      const url = new URL(
        typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url,
      );
      expect(init.method).toBe("GET");
      expect(url.pathname).toBe("/v1/issue/get-receive-address");
      return jsonResponse({ success: true, result: [{ warehouse_code: "W02984" }] });
    });

    const client = createClient(fetchMock);
    const response = await client.exceptions.getReceiveAddresses();
    expect(response.data[0]?.warehouse_code).toBe("W02984");
  });

  test("releaseIssue sends POST with correct body", async () => {
    const fetchMock = vi.fn(async (input: any, init: any) => {
      const url = new URL(
        typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url,
      );
      expect(url.pathname).toBe("/v1/issue/release");
      const body = JSON.parse(init.body);
      expect(body.waybill_number).toBe("WB1");
      expect(body.remark).toBe("fix");
      expect(body.extra_codes).toEqual(["203"]);
      return jsonResponse({ success: true, result: null });
    });

    const client = createClient(fetchMock);
    await client.exceptions.releaseIssue({
      waybillNumber: "WB1",
      remark: "fix",
      extraCodes: ["203"],
    });
  });

  test("modifyDeclarationInfo sends POST with normalized declaration_info body", async () => {
    const fetchMock = vi.fn(async (input: any, init: any) => {
      const url = new URL(
        typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url,
      );
      expect(url.pathname).toBe("/v1/issue/modify-declaration-info");
      const body = JSON.parse(init.body);
      expect(body).toEqual({
        waybill_number: "WB1",
        declaration_info: [
          {
            declaration_id: "2007502477338910720",
            name_local: "速溶咖啡",
            name_en: "instant coffee",
            material: "材质311",
            purpose: "用途333",
            hs_code: "210111",
          },
        ],
      });
      return jsonResponse({ success: true, result: null });
    });

    const client = createClient(fetchMock);
    await client.exceptions.modifyDeclarationInfo({
      waybillNumber: "WB1",
      declarationInfo: [
        {
          declarationId: "2007502477338910720",
          nameLocal: "速溶咖啡",
          nameEn: "instant coffee",
          material: "材质311",
          purpose: "用途333",
          hs_code: "210111",
        },
      ],
    });
  });

  test("handle sends POST with handle_type and issue type", async () => {
    const fetchMock = vi.fn(async (input: any, init: any) => {
      const url = new URL(
        typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url,
      );
      expect(url.pathname).toBe("/v1/issue/handle");
      expect(JSON.parse(init.body)).toEqual({
        waybill_number: "WB9",
        remark: "弃件",
        handle_type: 1,
        type: 1,
      });
      return jsonResponse({ success: true, result: null });
    });

    const client = createClient(fetchMock);
    await client.exceptions.handle({
      waybillNumber: "WB9",
      remark: "弃件",
      handleType: 1,
      issueType: 1,
    });
  });

  test("submitAppeal sends POST with waybill_numbers and file_ids", async () => {
    const fetchMock = vi.fn(async (input: any, init: any) => {
      const url = new URL(
        typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url,
      );
      expect(url.pathname).toBe("/v1/issue/feedback");
      expect(JSON.parse(init.body)).toEqual({
        waybill_numbers: ["WB10"],
        remark: "test",
        file_ids: ["file-1"],
        type: 1,
      });
      return jsonResponse({ success: true, result: null });
    });

    const client = createClient(fetchMock);
    await client.exceptions.submitAppeal({
      waybillNumbers: ["WB10"],
      remark: "test",
      fileIds: ["file-1"],
      issueType: 1,
    });
  });

  test("requestWarehouseProcess sends POST with extra_code", async () => {
    const fetchMock = vi.fn(async (input: any, init: any) => {
      const url = new URL(
        typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url,
      );
      expect(url.pathname).toBe("/v1/issue/warehouse-process");
      expect(JSON.parse(init.body)).toEqual({
        waybill_number: "WB11",
        extra_code: "202",
        remark: "remark",
      });
      return jsonResponse({ success: true, result: null });
    });

    const client = createClient(fetchMock);
    await client.exceptions.requestWarehouseProcess({
      waybillNumber: "WB11",
      extraCode: "202",
      remark: "remark",
    });
  });

  test("changeWaybillNumber sends POST with change number payload", async () => {
    const fetchMock = vi.fn(async (input: any, init: any) => {
      const url = new URL(
        typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url,
      );
      expect(url.pathname).toBe("/v1/issue/change-waybill-number");
      expect(JSON.parse(init.body)).toEqual({
        waybill_number: "WB12",
        new_waybill_number: "NEW12",
        change_number_type: 0,
        type: 1,
      });
      return jsonResponse({ success: true, result: null });
    });

    const client = createClient(fetchMock);
    await client.exceptions.changeWaybillNumber({
      waybillNumber: "WB12",
      newWaybillNumber: "NEW12",
      changeNumberType: 0,
      issueType: 1,
    });
  });

  test("supplyReturn sends POST with normalized cash_on_delivery info", async () => {
    const fetchMock = vi.fn(async (input: any, init: any) => {
      const url = new URL(
        typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url,
      );
      expect(url.pathname).toBe("/v1/issue/return-supply");
      expect(JSON.parse(init.body)).toEqual({
        waybill_number: "WB13",
        return_type: 2,
        driver_bring_back: undefined,
        cash_on_delivery: {
          country_code: "CN",
          province: "广东省",
          city: "深圳市",
          region: "南山区",
          address: "深圳市南山区科技园",
          first_name: "Mihatla",
          last_name: "Hxistea",
          phone_number: "491771417870",
          address_lines: undefined,
          house_number: undefined,
          vat_code: undefined,
          postal_code: undefined,
        },
        self_pickup: undefined,
      });
      return jsonResponse({ success: true, result: null });
    });

    const client = createClient(fetchMock);
    await client.exceptions.supplyReturn({
      waybillNumber: "WB13",
      returnType: 2,
      cashOnDelivery: {
        countryCode: "CN",
        province: "广东省",
        city: "深圳市",
        region: "南山区",
        address: "深圳市南山区科技园",
        firstName: "Mihatla",
        lastName: "Hxistea",
        phoneNumber: "491771417870",
      },
    });
  });

  test("reForecast sends POST with normalized receiver and declaration info", async () => {
    const fetchMock = vi.fn(async (input: any, init: any) => {
      const url = new URL(
        typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url,
      );
      expect(url.pathname).toBe("/v1/issue/re-forecast");
      expect(JSON.parse(init.body)).toEqual({
        waybill_number: "WB14",
        company: "Hunter, Elliott and Abbott",
        first_name: "Tammy",
        last_name: "Johnson",
        address_lines: ["PSC 5916, Box 3232", "APO AA 84445"],
        province: "Virginia",
        city: "New Williamberg",
        email: "michaelamy@example.org",
        phone_number: "13632822956",
        postal_code: "10724",
        house_number: "17",
        certificate_code: "S6EFCQKAVFDYCMT9",
        vat_code: "VAT211761239150000199776",
        declaration_info: [
          {
            declaration_id: "1849293536029929472",
            name_local: "旅行包",
            name_en: "Travel Bags",
            quantity: "12",
            unit_price: "1.67",
            unit_weight: "1.456",
            remark: "remark",
            hs_code: "4202210000",
            sku_code: "2-1-ZL0720-026-L-black",
            sales_url: "http://www.yunexpress.cn",
            origin_country: "us",
          },
        ],
      });
      return jsonResponse({ success: true, result: null });
    });

    const client = createClient(fetchMock);
    await client.exceptions.reForecast({
      waybillNumber: "WB14",
      company: "Hunter, Elliott and Abbott",
      firstName: "Tammy",
      lastName: "Johnson",
      addressLines: ["PSC 5916, Box 3232", "APO AA 84445"],
      province: "Virginia",
      city: "New Williamberg",
      email: "michaelamy@example.org",
      phoneNumber: "13632822956",
      postalCode: "10724",
      houseNumber: "17",
      certificateCode: "S6EFCQKAVFDYCMT9",
      vatCode: "VAT211761239150000199776",
      declarationInfo: [
        {
          declarationId: "1849293536029929472",
          nameLocal: "旅行包",
          nameEn: "Travel Bags",
          quantity: "12",
          unitPrice: "1.67",
          unitWeight: "1.456",
          remark: "remark",
          hsCode: "4202210000",
          skuCode: "2-1-ZL0720-026-L-black",
          salesUrl: "http://www.yunexpress.cn",
          originCountry: "us",
        },
      ],
    });
  });

  test("retryDelivery sends POST with normalized receiver info", async () => {
    const fetchMock = vi.fn(async (input: any, init: any) => {
      const url = new URL(
        typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url,
      );
      expect(url.pathname).toBe("/v1/issue/retry-delivery");
      expect(JSON.parse(init.body)).toEqual({
        waybill_number: "WB15",
        retry_type: 2,
        receiver: {
          first_name: "Mihatla Hxistea",
          province: "Germania",
          city: "Bad Bentheim",
          address_lines: ["Schuttorfer Str. 17 net, App. net"],
          postal_code: "48455",
          phone_number: "491771417870",
          company: "damaiwang Ltd.",
          house_number: "17",
          email: "oms@yunexpress.com",
          vat_code: "VAT211761239150000199776",
          remark: "remark",
          country_code: undefined,
          last_name: undefined,
        },
      });
      return jsonResponse({ success: true, result: null });
    });

    const client = createClient(fetchMock);
    await client.exceptions.retryDelivery({
      waybillNumber: "WB15",
      retryType: 2,
      receiver: {
        firstName: "Mihatla Hxistea",
        province: "Germania",
        city: "Bad Bentheim",
        addressLines: ["Schuttorfer Str. 17 net, App. net"],
        postalCode: "48455",
        phoneNumber: "491771417870",
        company: "damaiwang Ltd.",
        houseNumber: "17",
        email: "oms@yunexpress.com",
        vatCode: "VAT211761239150000199776",
        remark: "remark",
      },
    });
  });

  test("selectSolution sends POST and returns normalized result arrays", async () => {
    const fetchMock = vi.fn(async (input: any, init: any) => {
      const url = new URL(
        typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url,
      );
      expect(url.pathname).toBe("/v1/issue/select-solution");
      expect(JSON.parse(init.body)).toEqual({
        file_ids: ["file-2"],
        plan_code: "P0001",
        plan_desc: "方案说明",
        plan_name: "测试方案1",
        waybill_number: "WB16",
      });
      return jsonResponse({
        success: true,
        result: [{ plan_code: "P0001", plan_name: "测试方案1" }],
      });
    });

    const client = createClient(fetchMock);
    const response = await client.exceptions.selectSolution({
      waybillNumber: "WB16",
      fileIds: ["file-2"],
      planCode: "P0001",
      planDesc: "方案说明",
      planName: "测试方案1",
    });
    expect(response.data[0]?.plan_code).toBe("P0001");
  });

  test("submitCustomerFeedback sends POST with normalized consignee info", async () => {
    const fetchMock = vi.fn(async (input: any, init: any) => {
      const url = new URL(
        typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url,
      );
      expect(url.pathname).toBe("/v1/issue/customer-feedback");
      expect(JSON.parse(init.body)).toEqual({
        consignee: {
          address_lines: ["incididunt aliquip elit nulla"],
          city: "aliq",
          first_name: "molli",
          phone_number: "in reprehenderit",
          postal_code: "sed ea ut",
          province: "proident",
          last_name: "irure cillum Ut dolore",
          country_code: undefined,
          house_number: undefined,
          vat_code: undefined,
        },
        file_ids: ["1425555"],
        handling_plan: "BACK",
        waybill_number: "WB17",
      });
      return jsonResponse({ success: true, result: null });
    });

    const client = createClient(fetchMock);
    await client.exceptions.submitCustomerFeedback({
      waybillNumber: "WB17",
      handlingPlan: "BACK",
      fileIds: ["1425555"],
      consignee: {
        addressLines: ["incididunt aliquip elit nulla"],
        city: "aliq",
        firstName: "molli",
        phoneNumber: "in reprehenderit",
        postalCode: "sed ea ut",
        province: "proident",
        lastName: "irure cillum Ut dolore",
      },
    });
  });

  test("markAsRead sends POST with waybill number", async () => {
    const fetchMock = vi.fn(async (input: any, init: any) => {
      const url = new URL(
        typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url,
      );
      expect(url.pathname).toBe("/v1/issue/read");
      expect(JSON.parse(init.body)).toEqual({ waybill_number: "WB2" });
      return jsonResponse({ success: true, result: null });
    });

    const client = createClient(fetchMock);
    await client.exceptions.markAsRead({ waybillNumber: "WB2" });
  });

  test("getOptions sends GET with waybill_number query", async () => {
    const fetchMock = vi.fn(async (input: any) => {
      const url = new URL(
        typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url,
      );
      expect(url.pathname).toBe("/v1/issue/get-options");
      expect(url.searchParams.get("waybill_number")).toBe("WB3");
      return jsonResponse({ success: true, result: [{ plan_code: "P0001", plan_name: "Plan 1" }] });
    });

    const client = createClient(fetchMock);
    const response = await client.exceptions.getOptions({ waybillNumber: "WB3" });
    expect(response.data[0]?.plan_code).toBe("P0001");
  });

  test("getOrderDetail sends GET with waybill_number query", async () => {
    const fetchMock = vi.fn(async (input: any) => {
      const url = new URL(
        typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url,
      );
      expect(url.pathname).toBe("/v1/issue/get-order-detail");
      expect(url.searchParams.get("waybill_number")).toBe("WB4");
      return jsonResponse({ success: true, result: { waybill_number: "WB4", wo_info: [] } });
    });

    const client = createClient(fetchMock);
    const response = await client.exceptions.getOrderDetail({ waybillNumber: "WB4" });
    expect(response.data.waybill_number).toBe("WB4");
  });
});
