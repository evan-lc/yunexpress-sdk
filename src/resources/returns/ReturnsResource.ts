import type { YunExpressClient } from "../../client/YunExpressClient.ts";
import type { TransportRequestOptions, TransportResponse } from "../../http/transport.ts";
import { ResourceNamespace } from "../ResourceNamespace.ts";
import {
  assertValidCancelReturnOrdersRequest,
  assertValidCreateReturnOrderRequest,
  assertValidGetReturnLabelsRequest,
  assertValidGetReturnOrderDetailRequest,
  assertValidGetReturnSendTypesRequest,
  assertValidGetReturnTransferDetailRequest,
  assertValidGetReturnWarehousesRequest,
  type CancelReturnOrdersRequest,
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
        sender: {
          name: input.sender.name,
          phone_number: input.sender.phoneNumber,
          country_code: input.sender.countryCode,
          province: input.sender.province,
          city: input.sender.city,
          address_lines: input.sender.addressLines,
          address_lines1: input.sender.addressLines1,
          address_lines2: input.sender.addressLines2,
          postal_code: input.sender.postalCode,
        },
        goods_list: input.goodsList.map((item) => ({
          name_local: item.nameLocal,
          name_en: item.nameEn,
          quantity: item.quantity,
          ...item,
        })),
        label_type: input.labelType,
        receiver: input.receiver
          ? {
              name: input.receiver.name,
              company: input.receiver.company,
              phone_number: input.receiver.phoneNumber,
              country_code: input.receiver.countryCode,
              province: input.receiver.province,
              city: input.receiver.city,
              address_lines: input.receiver.addressLines,
              address_lines1: input.receiver.addressLines1,
              address_lines2: input.receiver.addressLines2,
              postal_code: input.receiver.postalCode,
              email: input.receiver.email,
            }
          : undefined,
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
