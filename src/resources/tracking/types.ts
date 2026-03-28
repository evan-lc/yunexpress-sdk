import { RequestExecutionError } from "../../errors/RequestExecutionError.ts";

export interface GetTrackingInfoRequest {
  orderNumber: string;
}

export type TrackEvent = {
  time_zone?: string;
  description?: string;
  event_date?: string;
  location?: string;
} & Record<string, unknown>;

export type TrackingResult = {
  waybill_number?: string;
  track_info?: Array<{
    track_events?: TrackEvent[];
  }>;
} & Record<string, unknown>;

export interface SubscribeTrackingByWaybillRequest {
  waybillNumbers: string[];
  subscriptionMode?: string;
}

export interface CancelTrackingSubscriptionByWaybillRequest {
  waybillNumbers: string[];
}

export interface GetTrackingSubscriptionByWaybillRequest {
  waybillNumbers: string[];
}

export interface SubscribeTrackingByProductRequest {
  productCodes: string[];
  subscriptionMode?: string;
}

export interface CancelTrackingSubscriptionByProductRequest {
  productCodes: string[];
}

export interface GetTrackingSubscriptionByProductRequest {
  productCode: string;
}

export type TrackingSubscriptionDataItem = {
  waybill_number?: string;
  product_code?: string;
  track_events?: TrackEvent[];
} & Record<string, unknown>;

export type TrackingSubscriptionDataResponse = TrackingSubscriptionDataItem[];

export function assertValidGetTrackingInfoRequest(input: GetTrackingInfoRequest): void {
  const orderNumber = input.orderNumber.trim();

  if (!orderNumber) {
    throw validationError("orderNumber is required.");
  }

  if (orderNumber.length > 50) {
    throw validationError("orderNumber must be between 1 and 50 characters.");
  }
}

export function assertValidWaybillNumbersRequest(waybillNumbers: string[], max: number): void {
  if (!Array.isArray(waybillNumbers) || waybillNumbers.length === 0) {
    throw validationError("waybillNumbers must contain at least one waybill number.");
  }

  if (waybillNumbers.length > max) {
    throw validationError(`waybillNumbers must contain at most ${max} waybill numbers.`);
  }
}

export function assertValidProductCodesRequest(productCodes: string[], max: number): void {
  if (!Array.isArray(productCodes) || productCodes.length === 0) {
    throw validationError("productCodes must contain at least one product code.");
  }

  if (productCodes.length > max) {
    throw validationError(`productCodes must contain at most ${max} product codes.`);
  }
}

export function assertValidGetTrackingSubscriptionByProductRequest(
  input: GetTrackingSubscriptionByProductRequest,
): void {
  if (!input.productCode.trim()) {
    throw validationError("productCode is required.");
  }
}

function validationError(message: string): RequestExecutionError {
  return new RequestExecutionError(message, {
    code: "VALIDATION_ERROR",
  });
}
