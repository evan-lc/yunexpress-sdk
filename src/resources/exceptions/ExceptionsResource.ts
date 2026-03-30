import type { YunExpressClient } from "../../client/YunExpressClient.ts";
import type { TransportRequestOptions, TransportResponse } from "../../http/transport.ts";
import { ResourceNamespace } from "../ResourceNamespace.ts";
import {
  assertValidChangeIssueWaybillNumberRequest,
  assertValidGetIssueOptionsRequest,
  assertValidGetIssueOrderDetailRequest,
  assertValidHandleIssueRequest,
  assertValidMarkIssueReadRequest,
  assertValidModifyIssueDeclarationInfoRequest,
  assertValidReforecastIssueRequest,
  assertValidReleaseIssueRequest,
  assertValidRequestIssueWarehouseProcessRequest,
  assertValidRetryIssueDeliveryRequest,
  assertValidSelectIssueSolutionRequest,
  assertValidSubmitIssueAppealRequest,
  assertValidSubmitIssueCustomerFeedbackRequest,
  assertValidSupplyIssueReturnRequest,
  type ChangeIssueWaybillNumberRequest,
  type GetIssueOptionsRequest,
  type GetIssueOptionsResponse,
  type GetIssueOrderDetailRequest,
  type GetIssueOrderDetailResponse,
  type GetIssueReceiveAddressesResponse,
  type HandleIssueRequest,
  type IssueAddressInfo,
  type IssueDeclarationInfoUpdateItem,
  type IssueReforecastDeclarationItem,
  type RequestIssueWarehouseProcessRequest,
  type ReforecastIssueRequest,
  type MarkIssueReadRequest,
  type ModifyIssueDeclarationInfoRequest,
  type ReleaseIssueRequest,
  type RetryIssueDeliveryRequest,
  type SelectIssueSolutionRequest,
  type SelectIssueSolutionResponse,
  type SubmitIssueAppealRequest,
  type SubmitIssueCustomerFeedbackRequest,
  type SupplyIssueReturnRequest,
} from "./types.ts";

export class ExceptionsResource extends ResourceNamespace {
  constructor(client: YunExpressClient) {
    super(client, "exceptions");
  }

  getReceiveAddresses(
    options: TransportRequestOptions = {},
  ): Promise<TransportResponse<GetIssueReceiveAddressesResponse>> {
    return this.request<GetIssueReceiveAddressesResponse>({
      ...options,
      method: "GET",
      path: "/v1/issue/get-receive-address",
    }).then((response) =>
      normalizeArrayResponse(response, (data) =>
        Array.isArray(data) ? (data as GetIssueReceiveAddressesResponse) : [],
      ),
    );
  }

  releaseIssue(
    input: ReleaseIssueRequest,
    options: TransportRequestOptions = {},
  ): Promise<TransportResponse<void>> {
    assertValidReleaseIssueRequest(input);

    return this.request<void>({
      ...options,
      method: "POST",
      path: "/v1/issue/release",
      body: {
        waybill_number: input.waybillNumber,
        remark: input.remark,
        new_waybill_numbers: input.newWaybillNumbers,
        extra_codes: input.extraCodes,
      },
    });
  }

  handle(
    input: HandleIssueRequest,
    options: TransportRequestOptions = {},
  ): Promise<TransportResponse<void>> {
    assertValidHandleIssueRequest(input);

    return this.request<void>({
      ...options,
      method: "POST",
      path: "/v1/issue/handle",
      body: {
        waybill_number: input.waybillNumber,
        remark: input.remark,
        handle_type: input.handleType,
        type: input.issueType,
      },
    });
  }

  submitAppeal(
    input: SubmitIssueAppealRequest,
    options: TransportRequestOptions = {},
  ): Promise<TransportResponse<void>> {
    assertValidSubmitIssueAppealRequest(input);

    return this.request<void>({
      ...options,
      method: "POST",
      path: "/v1/issue/feedback",
      body: {
        waybill_numbers: input.waybillNumbers,
        remark: input.remark,
        file_ids: input.fileIds,
        type: input.issueType,
      },
    });
  }

  requestWarehouseProcess(
    input: RequestIssueWarehouseProcessRequest,
    options: TransportRequestOptions = {},
  ): Promise<TransportResponse<void>> {
    assertValidRequestIssueWarehouseProcessRequest(input);

    return this.request<void>({
      ...options,
      method: "POST",
      path: "/v1/issue/warehouse-process",
      body: {
        waybill_number: input.waybillNumber,
        extra_code: input.extraCode,
        remark: input.remark,
      },
    });
  }

  changeWaybillNumber(
    input: ChangeIssueWaybillNumberRequest,
    options: TransportRequestOptions = {},
  ): Promise<TransportResponse<void>> {
    assertValidChangeIssueWaybillNumberRequest(input);

    return this.request<void>({
      ...options,
      method: "POST",
      path: "/v1/issue/change-waybill-number",
      body: {
        waybill_number: input.waybillNumber,
        new_waybill_number: input.newWaybillNumber,
        change_number_type: input.changeNumberType,
        type: input.issueType,
      },
    });
  }

  supplyReturn(
    input: SupplyIssueReturnRequest,
    options: TransportRequestOptions = {},
  ): Promise<TransportResponse<void>> {
    assertValidSupplyIssueReturnRequest(input);

    return this.request<void>({
      ...options,
      method: "POST",
      path: "/v1/issue/return-supply",
      body: {
        waybill_number: input.waybillNumber,
        return_type: input.returnType,
        driver_bring_back: normalizeIssueAddressInfo(input.driverBringBack),
        cash_on_delivery: normalizeIssueAddressInfo(input.cashOnDelivery),
        self_pickup: normalizeIssueAddressInfo(input.selfPickup),
      },
    });
  }

  reForecast(
    input: ReforecastIssueRequest,
    options: TransportRequestOptions = {},
  ): Promise<TransportResponse<void>> {
    assertValidReforecastIssueRequest(input);

    return this.request<void>({
      ...options,
      method: "POST",
      path: "/v1/issue/re-forecast",
      body: {
        waybill_number: input.waybillNumber,
        company: input.company,
        first_name: input.firstName,
        last_name: input.lastName,
        address_lines: input.addressLines,
        province: input.province,
        city: input.city,
        email: input.email,
        phone_number: input.phoneNumber,
        postal_code: input.postalCode,
        house_number: input.houseNumber,
        certificate_code: input.certificateCode,
        vat_code: input.vatCode,
        declaration_info: input.declarationInfo.map(normalizeReforecastDeclarationItem),
      },
    });
  }

  retryDelivery(
    input: RetryIssueDeliveryRequest,
    options: TransportRequestOptions = {},
  ): Promise<TransportResponse<void>> {
    assertValidRetryIssueDeliveryRequest(input);

    return this.request<void>({
      ...options,
      method: "POST",
      path: "/v1/issue/retry-delivery",
      body: {
        waybill_number: input.waybillNumber,
        retry_type: input.retryType,
        receiver: normalizeIssueAddressInfo(input.receiver),
      },
    });
  }

  selectSolution(
    input: SelectIssueSolutionRequest,
    options: TransportRequestOptions = {},
  ): Promise<TransportResponse<SelectIssueSolutionResponse>> {
    assertValidSelectIssueSolutionRequest(input);

    return this.request<SelectIssueSolutionResponse>({
      ...options,
      method: "POST",
      path: "/v1/issue/select-solution",
      body: {
        file_ids: input.fileIds,
        plan_code: input.planCode,
        plan_desc: input.planDesc,
        plan_name: input.planName,
        waybill_number: input.waybillNumber,
      },
    }).then((response) =>
      normalizeArrayResponse(response, (data) =>
        Array.isArray(data) ? (data as SelectIssueSolutionResponse) : [],
      ),
    );
  }

  submitCustomerFeedback(
    input: SubmitIssueCustomerFeedbackRequest,
    options: TransportRequestOptions = {},
  ): Promise<TransportResponse<void>> {
    assertValidSubmitIssueCustomerFeedbackRequest(input);

    return this.request<void>({
      ...options,
      method: "POST",
      path: "/v1/issue/customer-feedback",
      body: {
        consignee: normalizeIssueAddressInfo(input.consignee),
        file_ids: input.fileIds,
        handling_plan: input.handlingPlan,
        waybill_number: input.waybillNumber,
      },
    });
  }

  modifyDeclarationInfo(
    input: ModifyIssueDeclarationInfoRequest,
    options: TransportRequestOptions = {},
  ): Promise<TransportResponse<void>> {
    assertValidModifyIssueDeclarationInfoRequest(input);

    return this.request<void>({
      ...options,
      method: "POST",
      path: "/v1/issue/modify-declaration-info",
      body: {
        waybill_number: input.waybillNumber,
        declaration_info: input.declarationInfo.map(normalizeDeclarationInfoUpdate),
      },
    });
  }

  markAsRead(
    input: MarkIssueReadRequest,
    options: TransportRequestOptions = {},
  ): Promise<TransportResponse<void>> {
    assertValidMarkIssueReadRequest(input);

    return this.request<void>({
      ...options,
      method: "POST",
      path: "/v1/issue/read",
      body: {
        waybill_number: input.waybillNumber,
      },
    });
  }

  getOptions(
    input: GetIssueOptionsRequest,
    options: TransportRequestOptions = {},
  ): Promise<TransportResponse<GetIssueOptionsResponse>> {
    assertValidGetIssueOptionsRequest(input);

    return this.request<GetIssueOptionsResponse>({
      ...options,
      method: "GET",
      path: "/v1/issue/get-options",
      query: {
        ...options.query,
        waybill_number: input.waybillNumber,
      },
    }).then((response) =>
      normalizeArrayResponse(response, (data) =>
        Array.isArray(data) ? (data as GetIssueOptionsResponse) : [],
      ),
    );
  }

  getOrderDetail(
    input: GetIssueOrderDetailRequest,
    options: TransportRequestOptions = {},
  ): Promise<TransportResponse<GetIssueOrderDetailResponse>> {
    assertValidGetIssueOrderDetailRequest(input);

    return this.request<GetIssueOrderDetailResponse>({
      ...options,
      method: "GET",
      path: "/v1/issue/get-order-detail",
      query: {
        ...options.query,
        waybill_number: input.waybillNumber,
      },
    });
  }
}

function normalizeArrayResponse<TArray extends unknown[]>(
  response: TransportResponse<unknown>,
  extract: (data: unknown) => TArray,
): TransportResponse<TArray> {
  const normalized = extract(response.data);

  return {
    ...response,
    data: normalized,
    envelope: {
      ...response.envelope,
      result: normalized,
    },
  } as TransportResponse<TArray>;
}

function normalizeIssueAddressInfo(
  item: IssueAddressInfo | undefined,
): Record<string, unknown> | undefined {
  if (!item) {
    return undefined;
  }

  const {
    countryCode,
    firstName,
    lastName,
    phoneNumber,
    postalCode,
    addressLines,
    houseNumber,
    vatCode,
    ...rest
  } = item;

  return {
    ...rest,
    country_code: countryCode,
    first_name: firstName,
    last_name: lastName,
    phone_number: phoneNumber,
    postal_code: postalCode,
    address_lines: addressLines,
    house_number: houseNumber,
    vat_code: vatCode,
  };
}

function normalizeDeclarationInfoUpdate(
  item: IssueDeclarationInfoUpdateItem,
): Record<string, unknown> {
  const { declarationId, nameLocal, nameEn, material, purpose, ...rest } = item;

  return {
    ...rest,
    declaration_id: declarationId,
    name_local: nameLocal,
    name_en: nameEn,
    material,
    purpose,
  };
}

function normalizeReforecastDeclarationItem(
  item: IssueReforecastDeclarationItem,
): Record<string, unknown> {
  const {
    declarationId,
    nameLocal,
    nameEn,
    unitPrice,
    unitWeight,
    hsCode,
    skuCode,
    salesUrl,
    originCountry,
    ...rest
  } = item;

  return {
    ...rest,
    declaration_id: declarationId,
    name_local: nameLocal,
    name_en: nameEn,
    unit_price: unitPrice,
    unit_weight: unitWeight,
    hs_code: hsCode,
    sku_code: skuCode,
    sales_url: salesUrl,
    origin_country: originCountry,
  };
}
