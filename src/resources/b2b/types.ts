import { RequestExecutionError } from "../../errors/RequestExecutionError.ts";

export interface GetB2BWaybillDetailRequest {
  orderNumber: string;
}

export interface GetB2BLabelRequest {
  orderNumber: string;
}

export interface GetB2BLastMileCarriersRequest {
  waybillNumbers: string[];
}

export interface GetB2BProductsRequest {
  countryCode?: string;
}

export interface GetB2BWarehouseAddressesRequest {
  addressType?: 0 | 1 | 2 | 3;
  secondaryAddressType?: number | string;
  countryCode?: string;
}

export interface GetB2BSelfWarehousesRequest {
  productCode: string;
}

export type B2BLabelResponse = {
  order_number?: string;
  url?: string;
  label_type?: string;
  label_string?: string;
} & Record<string, unknown>;

export type B2BWaybillDeclarationItem = {
  quantity?: number;
  unit_price?: number;
  unit_weight?: number;
  name_cn?: string;
  name_en?: string;
  hs_code?: string;
  goods_url?: string;
  currency?: string;
  material?: string;
  purpose?: string;
  brand?: string;
  model?: string;
  quantity_unit?: string;
  remark?: string;
} & Record<string, unknown>;

export type B2BWaybillPackage = {
  weight?: number;
  length?: number;
  width?: number;
  height?: number;
  box_number?: string;
  reference_id?: string;
  declaration_info?: B2BWaybillDeclarationItem[];
} & Record<string, unknown>;

export type B2BWaybillParty = {
  name?: string;
  country_code?: string;
  province?: string;
  city?: string;
  address_lines?: Array<string | null>;
  postal_code?: string;
  phone_number?: string;
  company?: string;
  email?: string;
} & Record<string, unknown>;

export type B2BDeliveryInfo = {
  delivery_type?: number;
  collect_address?: string;
  collect_starttime?: string;
  collect_endtime?: string;
} & Record<string, unknown>;

export type GetB2BWaybillDetailResponse = {
  waybill_number?: string;
  customer_order_number?: string;
  product_code?: string;
  tracking_number?: string;
  pieces?: number;
  weight_unit?: string;
  size_unit?: string;
  status?: string;
  charge_weight?: number;
  packages?: B2BWaybillPackage[];
  receiver?: B2BWaybillParty;
  delivery_info?: B2BDeliveryInfo;
} & Record<string, unknown>;

export type B2BLastMileCarrierItem = {
  waybill_number?: string;
  tracking_number?: string;
  last_mile_site?: string;
  last_mile_code?: string;
  last_mile_name?: string;
  phone_number?: string;
} & Record<string, unknown>;

export type GetB2BLastMileCarriersResponse = B2BLastMileCarrierItem[];

export type B2BProductItem = {
  product_code?: string;
  product_name?: string;
} & Record<string, unknown>;

export type GetB2BProductsResponse = B2BProductItem[];

export type B2BSecondaryAddressTypeItem = {
  id?: number;
  name?: string;
} & Record<string, unknown>;

export type GetB2BSecondaryAddressTypesResponse = B2BSecondaryAddressTypeItem[];

export type B2BWarehouseAddressItem = {
  warehouse_code?: string;
  contact_person?: string;
  telephone?: string;
  street?: string;
  country_code?: string;
  province?: string;
  city?: string;
  postal_code?: string;
  address_type?: number;
  street2?: string;
  secondary_address_type?: number;
  email?: string | null;
  company?: string;
} & Record<string, unknown>;

export type GetB2BWarehouseAddressesResponse = B2BWarehouseAddressItem[];

export type B2BSelfWarehouseItem = {
  code?: string;
  name?: string;
  province?: string;
  city?: string;
  contact_info?: string;
  detail_address?: string;
  contact_name?: string;
} & Record<string, unknown>;

export type GetB2BSelfWarehousesResponse = B2BSelfWarehouseItem[];

export type B2BCollectWarehouseItem = {
  collect_address_name?: string;
  collect_address_code?: string;
  contact_person?: string;
  contact_phone?: string;
  collect_address?: string;
  state?: string;
  city?: string;
  district?: string;
  warehouse_start_time?: string;
  warehouse_end_time?: string;
} & Record<string, unknown>;

export type GetB2BCollectWarehousesResponse = B2BCollectWarehouseItem[];

export function assertValidGetB2BWaybillDetailRequest(input: GetB2BWaybillDetailRequest): void {
  assertOrderNumber(input.orderNumber);
}

export function assertValidGetB2BLabelRequest(input: GetB2BLabelRequest): void {
  assertOrderNumber(input.orderNumber);
}

export function assertValidGetB2BLastMileCarriersRequest(
  input: GetB2BLastMileCarriersRequest,
): void {
  if (!Array.isArray(input.waybillNumbers) || input.waybillNumbers.length === 0) {
    throw validationError("waybillNumbers must contain at least one waybill number.");
  }

  if (input.waybillNumbers.length > 20) {
    throw validationError("waybillNumbers must contain at most 20 waybill numbers.");
  }
}

export function assertValidGetB2BProductsRequest(input: GetB2BProductsRequest): void {
  if (input.countryCode !== undefined) {
    const trimmed = input.countryCode.trim();
    if (trimmed.length !== 2) {
      throw validationError("countryCode must be a 2-letter country code when provided.");
    }
  }
}

export function assertValidGetB2BWarehouseAddressesRequest(
  input: GetB2BWarehouseAddressesRequest,
): void {
  if (input.addressType !== undefined && ![0, 1, 2, 3].includes(input.addressType)) {
    throw validationError("addressType must be one of 0, 1, 2, or 3.");
  }

  if (input.countryCode !== undefined) {
    const trimmed = input.countryCode.trim();
    if (trimmed.length !== 2) {
      throw validationError("countryCode must be a 2-letter country code when provided.");
    }
  }
}

export function assertValidGetB2BSelfWarehousesRequest(input: GetB2BSelfWarehousesRequest): void {
  assertProductCode(input.productCode);
}

function assertOrderNumber(orderNumber: string): void {
  const trimmed = orderNumber.trim();

  if (!trimmed) {
    throw validationError("orderNumber is required.");
  }

  if (trimmed.length > 50) {
    throw validationError("orderNumber must be between 1 and 50 characters.");
  }
}

function assertProductCode(productCode: string): void {
  const trimmed = productCode.trim();

  if (!trimmed) {
    throw validationError("productCode is required.");
  }

  if (trimmed.length > 50) {
    throw validationError("productCode must be between 1 and 50 characters.");
  }
}

function validationError(message: string): RequestExecutionError {
  return new RequestExecutionError(message, {
    code: "VALIDATION_ERROR",
  });
}
