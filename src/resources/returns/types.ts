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

export interface GetReturnOrderDetailRequest {
  orderCode: string;
}

export interface GetReturnTransferDetailRequest {
  transferCode: string;
}

export interface CancelReturnOrdersRequest {
  orderCodes: string[];
}

export interface GetReturnLabelsRequest {
  orderCodes: string[];
}

export interface GetReturnWarehousesRequest {
  productCode: string;
  countryCode?: string;
}

export interface GetReturnSendTypesRequest {
  productCode: string;
  senderCountry: string;
  warehouseCountry: string;
}

export type ReturnLabelItem = {
  order_code?: string;
  label_url?: string;
} & Record<string, unknown>;

export type GetReturnLabelsResponse = ReturnLabelItem[];

export type ReturnProductExtraService = {
  extra_code?: string;
  extra_name?: string;
  is_default?: string;
} & Record<string, unknown>;

export type ReturnProductHandle = {
  handle_code?: string;
  handle_name?: string;
  extra_services?: ReturnProductExtraService[];
} & Record<string, unknown>;

export type ReturnProductItem = {
  product_code?: string;
  product_name?: string;
  product_en_name?: string;
  handle_list?: ReturnProductHandle[];
} & Record<string, unknown>;

export type GetReturnProductsResponse = ReturnProductItem[];

export type ReturnWarehouseItem = {
  warehouse_recv_country?: string[];
  product_code?: string;
  warehouse_code?: string;
  warehouse_name?: string;
  warehouse_contact?: string;
  warehouse_tel?: string;
  warehouse_country?: string;
  warehouse_province?: string;
  warehouse_city?: string;
  warehouse_postcode?: string;
  warehouse_address?: string;
} & Record<string, unknown>;

export type GetReturnWarehousesResponse = ReturnWarehouseItem[];

export type ReturnSendTypeItem = {
  sender_country?: string | null;
  warehouse_country?: string | null;
  shipping_method?: string;
  website_url?: string | null;
} & Record<string, unknown>;

export type GetReturnSendTypesResponse = ReturnSendTypeItem[];

export type GetReturnOrderDetailResponse = Record<string, unknown>;

export type ReturnTransferBoxDetail = {
  order_number?: string;
  tracking_number?: string;
  order_codes?: string[];
} & Record<string, unknown>;

export type GetReturnTransferDetailResponse = {
  unbox_order_codes?: string[];
  lost_order_codes?: string[];
  actual_box_count?: number;
  boxed_order_count?: number;
  box_details?: ReturnTransferBoxDetail[];
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

export function assertValidGetReturnOrderDetailRequest(input: GetReturnOrderDetailRequest): void {
  assertCode(input.orderCode, "orderCode");
}

export function assertValidGetReturnTransferDetailRequest(
  input: GetReturnTransferDetailRequest,
): void {
  assertCode(input.transferCode, "transferCode");
}

export function assertValidCancelReturnOrdersRequest(input: CancelReturnOrdersRequest): void {
  assertCodeArray(input.orderCodes, "orderCodes", 1000);
}

export function assertValidGetReturnLabelsRequest(input: GetReturnLabelsRequest): void {
  assertCodeArray(input.orderCodes, "orderCodes", 1000);
}

export function assertValidGetReturnWarehousesRequest(input: GetReturnWarehousesRequest): void {
  assertCode(input.productCode, "productCode");

  if (input.countryCode !== undefined && input.countryCode.trim().length !== 2) {
    throw validationError("countryCode must be a 2-letter country code when provided.");
  }
}

export function assertValidGetReturnSendTypesRequest(input: GetReturnSendTypesRequest): void {
  assertCode(input.productCode, "productCode");
  assertCountryCode(input.senderCountry, "senderCountry");
  assertCountryCode(input.warehouseCountry, "warehouseCountry");
}

function assertCountryCode(countryCode: string, fieldName: string): void {
  const trimmed = countryCode.trim();

  if (!trimmed) {
    throw validationError(`${fieldName} is required.`);
  }

  if (trimmed.length !== 2) {
    throw validationError(`${fieldName} must be a 2-letter country code.`);
  }
}

function assertCode(value: string, fieldName: string): void {
  const trimmed = value.trim();

  if (!trimmed) {
    throw validationError(`${fieldName} is required.`);
  }

  if (trimmed.length > 50) {
    throw validationError(`${fieldName} must be between 1 and 50 characters.`);
  }
}

function assertCodeArray(values: string[], fieldName: string, maxItems: number): void {
  if (!Array.isArray(values) || values.length === 0) {
    throw validationError(`${fieldName} must contain at least one item.`);
  }

  if (values.length > maxItems) {
    throw validationError(`${fieldName} must contain at most ${maxItems} items.`);
  }

  values.forEach((value, index) => {
    const trimmed = value.trim();

    if (!trimmed) {
      throw validationError(`${fieldName}[${index}] is required.`);
    }

    if (trimmed.length > 50) {
      throw validationError(`${fieldName}[${index}] must be between 1 and 50 characters.`);
    }
  });
}

function validationError(message: string): RequestExecutionError {
  return new RequestExecutionError(message, {
    code: "VALIDATION_ERROR",
  });
}
