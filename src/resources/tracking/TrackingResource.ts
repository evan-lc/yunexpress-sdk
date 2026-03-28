import type { YunExpressClient } from "../../client/YunExpressClient.ts";
import type { TransportRequestOptions, TransportResponse } from "../../http/transport.ts";
import { ResourceNamespace } from "../ResourceNamespace.ts";
import {
  assertValidGetTrackingInfoRequest,
  assertValidGetTrackingSubscriptionByProductRequest,
  assertValidProductCodesRequest,
  assertValidWaybillNumbersRequest,
  type CancelTrackingSubscriptionByProductRequest,
  type CancelTrackingSubscriptionByWaybillRequest,
  type GetTrackingInfoRequest,
  type GetTrackingSubscriptionByProductRequest,
  type GetTrackingSubscriptionByWaybillRequest,
  type SubscribeTrackingByProductRequest,
  type SubscribeTrackingByWaybillRequest,
  type TrackingResult,
  type TrackingSubscriptionDataResponse,
} from "./types.ts";

export class TrackingResource extends ResourceNamespace {
  constructor(client: YunExpressClient) {
    super(client, "tracking");
  }

  getTrackingInfo(
    input: GetTrackingInfoRequest,
    options: TransportRequestOptions = {},
  ): Promise<TransportResponse<TrackingResult>> {
    assertValidGetTrackingInfoRequest(input);

    return this.request<TrackingResult>({
      ...options,
      method: "GET",
      path: "/v1/track-service/info/get",
      query: {
        ...options.query,
        order_number: input.orderNumber,
      },
    });
  }

  subscribeByWaybill(
    input: SubscribeTrackingByWaybillRequest,
    options: TransportRequestOptions = {},
  ): Promise<TransportResponse<void>> {
    assertValidWaybillNumbersRequest(input.waybillNumbers, 50);

    return this.request<void>({
      ...options,
      method: "POST",
      path: "/v1/track-service/subscription/waybill/add",
      body: {
        waybill_numbers: input.waybillNumbers,
        subscription_mode: input.subscriptionMode,
      },
    });
  }

  cancelSubscriptionByWaybill(
    input: CancelTrackingSubscriptionByWaybillRequest,
    options: TransportRequestOptions = {},
  ): Promise<TransportResponse<void>> {
    assertValidWaybillNumbersRequest(input.waybillNumbers, 50);

    return this.request<void>({
      ...options,
      method: "POST",
      path: "/v1/track-service/subscription/waybill/cancel",
      body: { waybill_numbers: input.waybillNumbers },
    });
  }

  getSubscriptionByWaybill(
    input: GetTrackingSubscriptionByWaybillRequest,
    options: TransportRequestOptions = {},
  ): Promise<TransportResponse<TrackingSubscriptionDataResponse>> {
    assertValidWaybillNumbersRequest(input.waybillNumbers, 50);

    return this.request<TrackingSubscriptionDataResponse>({
      ...options,
      method: "GET",
      path: "/v1/track-service/subscription/waybill/get",
      query: {
        ...options.query,
        waybill_numbers: input.waybillNumbers.join(","),
      },
    });
  }

  subscribeByProduct(
    input: SubscribeTrackingByProductRequest,
    options: TransportRequestOptions = {},
  ): Promise<TransportResponse<void>> {
    assertValidProductCodesRequest(input.productCodes, 50);

    return this.request<void>({
      ...options,
      method: "POST",
      path: "/v1/track-service/subscription/product/add",
      body: {
        product_codes: input.productCodes,
        subscription_mode: input.subscriptionMode,
      },
    });
  }

  cancelSubscriptionByProduct(
    input: CancelTrackingSubscriptionByProductRequest,
    options: TransportRequestOptions = {},
  ): Promise<TransportResponse<void>> {
    assertValidProductCodesRequest(input.productCodes, 50);

    return this.request<void>({
      ...options,
      method: "POST",
      path: "/v1/track-service/subscription/product/cancel",
      body: { product_codes: input.productCodes },
    });
  }

  getSubscriptionByProduct(
    input: GetTrackingSubscriptionByProductRequest,
    options: TransportRequestOptions = {},
  ): Promise<TransportResponse<TrackingSubscriptionDataResponse>> {
    assertValidGetTrackingSubscriptionByProductRequest(input);

    return this.request<TrackingSubscriptionDataResponse>({
      ...options,
      method: "GET",
      path: "/v1/track-service/subscription/product/get",
      query: {
        ...options.query,
        product_code: input.productCode,
      },
    });
  }
}
