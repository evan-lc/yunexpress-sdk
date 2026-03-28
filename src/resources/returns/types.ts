import { RequestExecutionError } from "../../errors/RequestExecutionError.ts";

export interface ReturnOrderSender {
  name: string;
  phoneNumber: string;
  countryCode: string;
  province: string;
  city: string;
  addressLines: string;
  addressLines1?: string;
  addressLines2?: string;
  postalCode: string;
}

export interface ReturnOrderReceiver {
  name?: string;
  company?: string;
  phoneNumber?: string;
  countryCode?: string;
  province?: string;
  city?: string;
  addressLines?: string;
  addressLines1?: string;
  addressLines2?: string;
  postalCode?: string;
  email?: string;
}

export type ReturnOrderGoodsItem = {
  nameLocal?: string;
  nameEn?: string;
  quantity?: number;
} & Record<string, unknown>;

export interface CreateReturnOrderRequest {
  productCode: string;
  handleCode: "RTQJ" | "RTXH" | "RTZC" | "RTZY";
  warehouseCode: string;
  sendType: "RTPUDO" | "RTSM" | "RTZD" | "RTZJ";
  trackingNumber?: string;
  sendServiceName?: string;
  weight: number;
  length: number;
  width: number;
  height: number;
  extraServices?: string[];
  sender: ReturnOrderSender;
  goodsList: ReturnOrderGoodsItem[];
  labelType?: "PDF" | "PNG" | "ZPL";
  receiver?: ReturnOrderReceiver;
  iossNumber?: string;
  vatNumber?: string;
  eoriNumber?: string;
  customerOrderNo?: string;
  sendServiceCode?: string;
}

export type CreateReturnOrderResponse = {
  order_code?: string;
  tracking_number?: string;
  label_urls?: string[];
  website_url?: string;
  free_days?: number;
} & Record<string, unknown>;

export function assertValidCreateReturnOrderRequest(input: CreateReturnOrderRequest): void {
  if (!input.productCode.trim()) {
    throw validationError("productCode is required.");
  }

  if (!input.warehouseCode.trim()) {
    throw validationError("warehouseCode is required.");
  }

  if (!Number.isFinite(input.weight) || input.weight < 0.01 || input.weight > 1000) {
    throw validationError("weight must be between 0.01 and 1000.");
  }

  if (!Array.isArray(input.goodsList) || input.goodsList.length === 0) {
    throw validationError("goodsList must contain at least one item.");
  }

  if (!input.sender.name?.trim()) {
    throw validationError("sender.name is required.");
  }

  if (!input.sender.countryCode?.trim()) {
    throw validationError("sender.countryCode is required.");
  }
}

function validationError(message: string): RequestExecutionError {
  return new RequestExecutionError(message, {
    code: "VALIDATION_ERROR",
  });
}
