import type { YunExpressClient } from "../../client/YunExpressClient.ts";
import type { TransportRequestOptions, TransportResponse } from "../../http/transport.ts";
import { RequestExecutionError } from "../../errors/RequestExecutionError.ts";
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
  type TrackingSubscribeProduct,
  type TrackingSubscribeType,
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
    const subscribeType = resolveSubscribeType(input.subscribeType, input.subscriptionMode);

    return this.request<void>({
      ...options,
      method: "POST",
      path: "/v1/track-service/subscribe-by-order",
      body: {
        waybill_numbers: input.waybillNumbers,
        subscribe_type: subscribeType,
        query_type: input.queryTypes,
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
      path: "/v1/track-service/unsubscribe-by-order",
      body: { waybill_numbers: input.waybillNumbers },
    });
  }

  getSubscriptionByWaybill(
    input: GetTrackingSubscriptionByWaybillRequest,
    options: TransportRequestOptions = {},
  ): Promise<TransportResponse<TrackingSubscriptionDataResponse>> {
    assertValidWaybillNumbersRequest(input.waybillNumbers, 50);

    return this.request<{ order_subscribe_info?: TrackingSubscriptionDataResponse }>({
      ...options,
      method: "GET",
      path: "/v1/track-service/subscribe-by-order/get",
      query: {
        ...options.query,
        waybill_numbers: input.waybillNumbers.join(","),
      },
    }).then((response) => normalizeTrackingSubscriptionResponse(response, "order_subscribe_info"));
  }

  subscribeByProduct(
    input: SubscribeTrackingByProductRequest,
    options: TransportRequestOptions = {},
  ): Promise<TransportResponse<void>> {
    const subscribeProducts = toSubscribeProducts(input);
    const subscribeType = resolveSubscribeType(input.subscribeType, input.subscriptionMode);

    return this.request<void>({
      ...options,
      method: "POST",
      path: "/v1/track-service/subscribe-by-shipping",
      body: {
        subscribe_products: subscribeProducts,
        subscribe_type: subscribeType,
        query_type: input.queryTypes,
      },
    });
  }

  cancelSubscriptionByProduct(
    input: CancelTrackingSubscriptionByProductRequest,
    options: TransportRequestOptions = {},
  ): Promise<TransportResponse<void>> {
    const subscribeProducts = toSubscribeProducts(input);

    return this.request<void>({
      ...options,
      method: "POST",
      path: "/v1/track-service/unsubscribe-by-shipping",
      body: { subscribe_products: subscribeProducts },
    });
  }

  getSubscriptionByProduct(
    input: GetTrackingSubscriptionByProductRequest,
    options: TransportRequestOptions = {},
  ): Promise<TransportResponse<TrackingSubscriptionDataResponse>> {
    assertValidGetTrackingSubscriptionByProductRequest(input);

    return this.request<{ ProductSubscribe?: TrackingSubscriptionDataResponse }>({
      ...options,
      method: "GET",
      path: "/v1/track-service/subscribe-by-shipping/get",
      query: {
        ...options.query,
        product_code: input.productCode,
      },
    }).then((response) => normalizeTrackingSubscriptionResponse(response, "ProductSubscribe"));
  }
}

function resolveSubscribeType(
  subscribeType: TrackingSubscribeType | undefined,
  subscriptionMode: TrackingSubscribeType | undefined,
): TrackingSubscribeType {
  const resolved = subscribeType ?? subscriptionMode;

  if (!resolved) {
    throw validationError("subscribeType is required.");
  }

  return resolved;
}

function toSubscribeProducts(
  input: SubscribeTrackingByProductRequest | CancelTrackingSubscriptionByProductRequest,
): Array<{ product_code: string; country_codes?: string[] }> {
  const subscribeProducts = input.subscribeProducts?.map((item) => normalizeSubscribeProduct(item));

  if (subscribeProducts && subscribeProducts.length > 0) {
    if (subscribeProducts.length > 50) {
      throw validationError("subscribeProducts must contain at most 50 items.");
    }

    return subscribeProducts;
  }

  if (!input.productCodes) {
    throw validationError("productCodes or subscribeProducts is required.");
  }

  assertValidProductCodesRequest(input.productCodes, 50);

  return input.productCodes.map((productCode) => normalizeSubscribeProduct({ productCode }));
}

function normalizeSubscribeProduct(item: TrackingSubscribeProduct): {
  product_code: string;
  country_codes?: string[];
} {
  const productCode = item.productCode.trim();

  if (!productCode) {
    throw validationError("subscribeProducts[].productCode is required.");
  }

  return {
    product_code: productCode,
    country_codes: item.countryCodes?.map((countryCode) => countryCode.trim()).filter(Boolean),
  };
}

function normalizeTrackingSubscriptionResponse(
  response: TransportResponse<unknown>,
  key: "ProductSubscribe" | "order_subscribe_info",
): TransportResponse<TrackingSubscriptionDataResponse> {
  const payload = response.data;
  const data =
    payload &&
    typeof payload === "object" &&
    Array.isArray((payload as Record<string, unknown>)[key])
      ? ((payload as Record<string, unknown>)[key] as TrackingSubscriptionDataResponse)
      : [];

  return {
    ...response,
    data,
    envelope: {
      ...response.envelope,
      result: data,
    },
  } as TransportResponse<TrackingSubscriptionDataResponse>;
}

function validationError(message: string): RequestExecutionError {
  return new RequestExecutionError(message, {
    code: "VALIDATION_ERROR",
  });
}
