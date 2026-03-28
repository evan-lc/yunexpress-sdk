import type { YunExpressClient } from "../../client/YunExpressClient.ts";
import type { TransportRequestOptions, TransportResponse } from "../../http/transport.ts";
import { ResourceNamespace } from "../ResourceNamespace.ts";
import {
  assertValidCancelOrderRequest,
  assertValidCreatePackageRequest,
  assertValidGetLastMileCarriersRequest,
  assertValidGetPickupPointsRequest,
  assertValidGetSenderRequest,
  assertValidGetWaybillDetailRequest,
  assertValidHoldOrderRequest,
  assertValidModifyWeightRequest,
  type CancelOrderRequest,
  type CreatePackageRequest,
  type CreatePackageResponse,
  type GetLastMileCarriersRequest,
  type GetLastMileCarriersResponse,
  type GetPickupPointsRequest,
  type GetPickupPointsResponse,
  type GetSenderResponse,
  type GetSenderRequest,
  type GetWaybillDetailRequest,
  type GetWaybillDetailResponse,
  type HoldOrderRequest,
  type ModifyWeightRequest,
} from "./types.ts";

export class OrdersResource extends ResourceNamespace {
  constructor(client: YunExpressClient) {
    super(client, "orders");
  }

  createPackage(
    input: CreatePackageRequest,
    options: TransportRequestOptions = {},
  ): Promise<TransportResponse<CreatePackageResponse>> {
    assertValidCreatePackageRequest(input);

    return this.request<CreatePackageResponse, CreatePackageRequest>({
      ...options,
      method: "POST",
      path: "/v1/order/package/create",
      body: input,
    });
  }

  getWaybillDetail(
    input: GetWaybillDetailRequest,
    options: TransportRequestOptions = {},
  ): Promise<TransportResponse<GetWaybillDetailResponse>> {
    assertValidGetWaybillDetailRequest(input);

    return this.request<GetWaybillDetailResponse>({
      ...options,
      method: "GET",
      path: "/v1/order/info/get",
      query: {
        ...options.query,
        order_number: input.orderNumber,
      },
    });
  }

  getSender(
    input: GetSenderRequest,
    options: TransportRequestOptions = {},
  ): Promise<TransportResponse<GetSenderResponse>> {
    assertValidGetSenderRequest(input);

    return this.request<GetSenderResponse>({
      ...options,
      method: "GET",
      path: "/v1/order/sender/get",
      query: {
        ...options.query,
        order_number: input.orderNumber,
      },
    });
  }

  getLastMileCarriers(
    input: GetLastMileCarriersRequest,
    options: TransportRequestOptions = {},
  ): Promise<TransportResponse<GetLastMileCarriersResponse>> {
    assertValidGetLastMileCarriersRequest(input);

    return this.request<GetLastMileCarriersResponse, { waybill_numbers: string[] }>({
      ...options,
      method: "POST",
      path: "/v1/order/last-mile/get",
      body: { waybill_numbers: input.waybillNumbers },
    });
  }

  modifyWeight(
    input: ModifyWeightRequest,
    options: TransportRequestOptions = {},
  ): Promise<TransportResponse<void>> {
    assertValidModifyWeightRequest(input);

    return this.request<void>({
      ...options,
      method: "POST",
      path: "/v1/order/weight/modify",
      body: {
        waybill_number: input.waybillNumber,
        weight: input.weight,
        weight_unit: input.weightUnit ?? "KG",
      },
    });
  }

  cancelOrder(
    input: CancelOrderRequest,
    options: TransportRequestOptions = {},
  ): Promise<TransportResponse<void>> {
    assertValidCancelOrderRequest(input);

    return this.request<void>({
      ...options,
      method: "POST",
      path: "/v1/order/cancel",
      body: { waybill_number: input.waybillNumber },
    });
  }

  holdOrder(
    input: HoldOrderRequest,
    options: TransportRequestOptions = {},
  ): Promise<TransportResponse<void>> {
    assertValidHoldOrderRequest(input);

    return this.request<void>({
      ...options,
      method: "POST",
      path: "/v1/order/hold",
      body: {
        waybill_number: input.waybillNumber,
        remark: input.remark,
      },
    });
  }

  getPickupPoints(
    input: GetPickupPointsRequest,
    options: TransportRequestOptions = {},
  ): Promise<TransportResponse<GetPickupPointsResponse>> {
    assertValidGetPickupPointsRequest(input);

    return this.request<GetPickupPointsResponse>({
      ...options,
      method: "POST",
      path: "/v1/pickup/get",
      body: {
        country_code: input.countryCode,
        postal_code: input.postalCode,
        city: input.city,
        carrier_code: input.carrierCode,
      },
    });
  }
}
