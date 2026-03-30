import type { YunExpressClient } from "../../client/YunExpressClient.ts";
import type { TransportRequestOptions, TransportResponse } from "../../http/transport.ts";
import { ResourceNamespace } from "../ResourceNamespace.ts";
import {
  assertValidCancelReturnOrdersRequest,
  assertValidCreateReturnTransferRequest,
  assertValidCreateReturnOrderRequest,
  assertValidGetReturnLabelsRequest,
  assertValidGetReturnOrderDetailRequest,
  assertValidGetReturnSendTypesRequest,
  assertValidGetReturnTransferDetailRequest,
  assertValidGetReturnWarehousesRequest,
  assertValidProcessReturnArrivalRequest,
  type CancelReturnOrdersRequest,
  type CreateReturnTransferRequest,
  type CreateReturnTransferResponse,
  type CreateReturnOrderRequest,
  type CreateReturnOrderResponse,
  type GetReturnLabelsRequest,
  type GetReturnLabelsResponse,
  type GetReturnOrderDetailRequest,
  type GetReturnOrderDetailResponse,
  type GetReturnProductsResponse,
  type GetReturnSendTypesRequest,
  type GetReturnSendTypesResponse,
  type GetReturnTransferDetailRequest,
  type GetReturnTransferDetailResponse,
  type GetReturnWarehousesRequest,
  type GetReturnWarehousesResponse,
  type ProcessReturnArrivalRequest,
} from "./types.ts";

export class ReturnsResource extends ResourceNamespace {
  constructor(client: YunExpressClient) {
    super(client, "returns");
  }

  getOrderDetail(
    input: GetReturnOrderDetailRequest,
    options: TransportRequestOptions = {},
  ): Promise<TransportResponse<GetReturnOrderDetailResponse>> {
    assertValidGetReturnOrderDetailRequest(input);

    return this.request<GetReturnOrderDetailResponse>({
      ...options,
      method: "GET",
      path: "/v1/openapi/order/detail",
      query: {
        ...options.query,
        order_code: input.orderCode,
      },
    });
  }

  getTransferDetail(
    input: GetReturnTransferDetailRequest,
    options: TransportRequestOptions = {},
  ): Promise<TransportResponse<GetReturnTransferDetailResponse>> {
    assertValidGetReturnTransferDetailRequest(input);

    return this.request<GetReturnTransferDetailResponse>({
      ...options,
      method: "GET",
      path: "/v1/openapi/order/transferdetail",
      query: {
        ...options.query,
        transfer_code: input.transferCode,
      },
    });
  }

  createReturnOrder(
    input: CreateReturnOrderRequest,
    options: TransportRequestOptions = {},
  ): Promise<TransportResponse<CreateReturnOrderResponse>> {
    assertValidCreateReturnOrderRequest(input);

    return this.request<CreateReturnOrderResponse>({
      ...options,
      method: "POST",
      path: "/v1/openapi/order/add",
      body: {
        product_code: input.productCode,
        handle_code: input.handleCode,
        warehouse_code: input.warehouseCode,
        send_type: input.sendType,
        tracking_number: input.trackingNumber,
        send_service_name: input.sendServiceName,
        weight: input.weight,
        length: input.length,
        width: input.width,
        height: input.height,
        extra_services: input.extraServices,
        sender: normalizeReturnSender(input.sender),
        goods_list: input.goodsList.map(normalizeReturnGoodsItem),
        label_type: input.labelType,
        receiver: normalizeReturnReceiver(input.receiver),
        ioss_number: input.iossNumber,
        vat_number: input.vatNumber,
        eori_number: input.eoriNumber,
        customer_order_no: input.customerOrderNo,
        send_service_code: input.sendServiceCode,
      },
    });
  }

  cancelOrders(
    input: CancelReturnOrdersRequest,
    options: TransportRequestOptions = {},
  ): Promise<TransportResponse<void>> {
    assertValidCancelReturnOrdersRequest(input);

    return this.request<void>({
      ...options,
      method: "POST",
      path: "/v1/openapi/order/cancel",
      body: {
        order_codes: input.orderCodes,
      },
    });
  }

  getLabels(
    input: GetReturnLabelsRequest,
    options: TransportRequestOptions = {},
  ): Promise<TransportResponse<GetReturnLabelsResponse>> {
    assertValidGetReturnLabelsRequest(input);

    return this.request<GetReturnLabelsResponse>({
      ...options,
      method: "POST",
      path: "/v1/openapi/order/downloadlabels",
      body: {
        order_codes: input.orderCodes,
      },
    }).then((response) =>
      normalizeArrayResponse(response, (data) =>
        Array.isArray(data) ? (data as GetReturnLabelsResponse) : [],
      ),
    );
  }

  getProducts(
    options: TransportRequestOptions = {},
  ): Promise<TransportResponse<GetReturnProductsResponse>> {
    return this.request<GetReturnProductsResponse>({
      ...options,
      method: "GET",
      path: "/v1/openapi/product/list",
    }).then((response) =>
      normalizeArrayResponse(response, (data) =>
        Array.isArray(data) ? (data as GetReturnProductsResponse) : [],
      ),
    );
  }

  getWarehouses(
    input: GetReturnWarehousesRequest,
    options: TransportRequestOptions = {},
  ): Promise<TransportResponse<GetReturnWarehousesResponse>> {
    assertValidGetReturnWarehousesRequest(input);

    return this.request<GetReturnWarehousesResponse>({
      ...options,
      method: "GET",
      path: "/v1/openapi/product/warehouse-list",
      query: {
        ...options.query,
        product_code: input.productCode,
        country_code: input.countryCode,
      },
    }).then((response) =>
      normalizeArrayResponse(response, (data) =>
        Array.isArray(data) ? (data as GetReturnWarehousesResponse) : [],
      ),
    );
  }

  getSendTypes(
    input: GetReturnSendTypesRequest,
    options: TransportRequestOptions = {},
  ): Promise<TransportResponse<GetReturnSendTypesResponse>> {
    assertValidGetReturnSendTypesRequest(input);

    return this.request<GetReturnSendTypesResponse>({
      ...options,
      method: "GET",
      path: "/v1/openapi/product/send-type-list",
      query: {
        ...options.query,
        product_code: input.productCode,
        sender_country: input.senderCountry,
        warehouse_country: input.warehouseCountry,
      },
    }).then((response) =>
      normalizeArrayResponse(response, (data) =>
        Array.isArray(data) ? (data as GetReturnSendTypesResponse) : [],
      ),
    );
  }

  processArrival(
    input: ProcessReturnArrivalRequest,
    options: TransportRequestOptions = {},
  ): Promise<TransportResponse<void>> {
    assertValidProcessReturnArrivalRequest(input);

    return this.request<void>({
      ...options,
      method: "POST",
      path: "/v1/openapi/order/operation",
      body: {
        order_codes: input.orderCodes,
        type: input.operationType,
      },
    });
  }

  createTransferOrder(
    input: CreateReturnTransferRequest,
    options: TransportRequestOptions = {},
  ): Promise<TransportResponse<CreateReturnTransferResponse>> {
    assertValidCreateReturnTransferRequest(input);

    return this.request<CreateReturnTransferResponse>({
      ...options,
      method: "POST",
      path: "/v1/openapi/order/transfer",
      body: {
        order_codes: input.orderCodes,
        ioss_number: input.iossNumber,
        vat_number: input.vatNumber,
        eori_number: input.eoriNumber,
        receiver: normalizeReturnReceiver(input.receiver),
        goods_list: input.goodsList?.map(normalizeReturnGoodsItem),
      },
    });
  }
}

function normalizeReturnSender(
  sender: CreateReturnOrderRequest["sender"],
): Record<string, unknown> {
  return {
    name: sender.name,
    phone_number: sender.phoneNumber,
    country_code: sender.countryCode,
    province: sender.province,
    city: sender.city,
    address_lines: sender.addressLines,
    address_lines1: sender.addressLines1,
    address_lines2: sender.addressLines2,
    postal_code: sender.postalCode,
  };
}

function normalizeReturnReceiver(
  receiver:
    | CreateReturnOrderRequest["receiver"]
    | CreateReturnTransferRequest["receiver"]
    | undefined,
): Record<string, unknown> | undefined {
  if (!receiver) {
    return undefined;
  }

  return {
    name: receiver.name,
    company: receiver.company,
    phone_number: receiver.phoneNumber,
    country_code: receiver.countryCode,
    province: receiver.province,
    city: receiver.city,
    address_lines: receiver.addressLines,
    address_lines1: receiver.addressLines1,
    address_lines2: receiver.addressLines2,
    postal_code: receiver.postalCode,
    email: receiver.email,
  };
}

function normalizeReturnGoodsItem(
  item: CreateReturnOrderRequest["goodsList"][number],
): Record<string, unknown> {
  return {
    ...item,
    name_local: item.nameLocal,
    name_en: item.nameEn,
    quantity: item.quantity,
  };
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
