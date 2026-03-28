import { RequestExecutionError } from "../../errors/RequestExecutionError.ts";

export type WeightUnit = string;
export type SizeUnit = string;

export type ContactParty = {
  name?: string;
  company?: string;
  countryCode?: string;
  province?: string;
  city?: string;
  addressLine1?: string;
  addressLine2?: string;
  addressLine3?: string;
  postalCode?: string;
  phone?: string;
  email?: string;
  idType?: string;
  idNumber?: string;
} & Record<string, unknown>;

export interface PackageDimensions {
  length?: number;
  width?: number;
  height?: number;
  weight: number;
}

export type CreatePackagePackage = PackageDimensions & Record<string, unknown>;

export type DeclarationItem = {
  sku?: string;
  name?: string;
  quantity?: number;
  declaredValue?: number;
  currency?: string;
  unitWeight?: number;
  hsCode?: string;
  material?: string;
  usage?: string;
  brand?: string;
  specification?: string;
  model?: string;
  remark?: string;
} & Record<string, unknown>;

export type CreatePackageRequest = {
  productCode: string;
  customerOrderNumber: string;
  orderNumbers?: string[];
  weightUnit: WeightUnit;
  sizeUnit: SizeUnit;
  dangerousGoodsType?: string;
  packages: CreatePackagePackage[];
  receiver: ContactParty;
  declarationInfo: DeclarationItem[];
  sender?: ContactParty;
  customsNumber?: string;
  extraServices?: Array<Record<string, unknown>>;
  platformAccountCode?: string;
  sourceCode?: string;
  sensitiveType?: string;
  labelType?: string;
  pointRelaisNum?: string;
  manufactureSalesName?: string;
  creditCode?: string;
} & Record<string, unknown>;

export type CreatePackageResponse = {
  customerOrderNumber?: string;
  trackType?: string;
  waybillNumber?: string;
  trackingNumber?: string;
  barCodes?: string[];
  remoteArea?: boolean | number | string;
  shipperBoxs?: Array<Record<string, unknown>>;
} & Record<string, unknown>;

export interface GetWaybillDetailRequest {
  orderNumber: string;
}

export interface GetSenderRequest {
  orderNumber: string;
}

export type GetSenderResponse = WaybillParty;

export interface GetLastMileCarriersRequest {
  waybillNumbers: string[];
}

export type LastMileCarrierItem = {
  waybill_number?: string;
  carrier_code?: string;
  carrier_name?: string;
} & Record<string, unknown>;

export type GetLastMileCarriersResponse = LastMileCarrierItem[];

export interface ModifyWeightRequest {
  waybillNumber: string;
  weight: number;
  weightUnit?: "G" | "KG" | "LBS";
}

export interface CancelOrderRequest {
  waybillNumber: string;
}

export interface HoldOrderRequest {
  waybillNumber: string;
  remark?: string;
}

export interface GetPickupPointsRequest {
  countryCode: string;
  postalCode?: string;
  city?: string;
  carrierCode?: string;
}

export type PickupPointItem = {
  point_id?: string;
  point_name?: string;
  address?: string;
  city?: string;
  postal_code?: string;
  country_code?: string;
  carrier_code?: string;
  latitude?: number;
  longitude?: number;
} & Record<string, unknown>;

export type GetPickupPointsResponse = PickupPointItem[];

export type WaybillQueryStatus = string;

export type WaybillRefParcel = {
  sku_code?: string;
  quantity?: number;
} & Record<string, unknown>;

export type WaybillPackage = {
  weight?: number;
  length?: number;
  width?: number;
  height?: number;
  box_number?: string;
  reference_id?: string;
  ref_parcels?: WaybillRefParcel[];
} & Record<string, unknown>;

export type WaybillParty = {
  first_name?: string;
  last_name?: string;
  country_code?: string;
  province?: string;
  city?: string;
  address_lines?: Array<string | null>;
  postal_code?: string;
  phone_number?: string;
  company?: string;
  email?: string | null;
  certificate_code?: string | null;
  certificate_type?: string | null;
} & Record<string, unknown>;

export type WaybillDeclarationItem = {
  quantity?: number;
  unit_price?: number;
  unit_weight?: number;
  name_local?: string;
  sku_code?: string;
  name_en?: string;
  hs_code?: string;
  sales_url?: string;
  currency?: string;
  material?: string | null;
  purpose?: string | null;
  brand?: string | null;
  spec?: string | null;
  model?: string | null;
  remark?: string;
  attachment?: string | null;
} & Record<string, unknown>;

export type GetWaybillDetailResponse = {
  waybill_number?: string;
  customer_order_number?: string;
  product_code?: string;
  tracking_number?: string;
  platform_account_code?: string;
  pieces?: number;
  weight_unit?: string;
  size_unit?: string;
  status?: WaybillQueryStatus;
  sensitive_type?: number | string;
  source_code?: string;
  chargeWeight?: number;
  packages?: WaybillPackage[];
  receiver?: WaybillParty;
  sender?: WaybillParty;
  declaration_info?: WaybillDeclarationItem[];
} & Record<string, unknown>;

export function assertValidCreatePackageRequest(input: CreatePackageRequest): void {
  if (!input.productCode.trim()) {
    throw validationError("productCode is required.");
  }

  if (!input.customerOrderNumber.trim()) {
    throw validationError("customerOrderNumber is required.");
  }

  if (!Array.isArray(input.packages) || input.packages.length === 0) {
    throw validationError("packages must contain at least one package.");
  }

  if (!Array.isArray(input.declarationInfo) || input.declarationInfo.length === 0) {
    throw validationError("declarationInfo must contain at least one declaration item.");
  }

  input.packages.forEach((packageEntry, index) => {
    validatePackageWeight(packageEntry.weight, index);
  });
}

export function assertValidGetWaybillDetailRequest(input: GetWaybillDetailRequest): void {
  assertOrderNumber(input.orderNumber);
}

export function assertValidGetSenderRequest(input: GetSenderRequest): void {
  assertOrderNumber(input.orderNumber);
}

export function assertValidGetLastMileCarriersRequest(input: GetLastMileCarriersRequest): void {
  if (!Array.isArray(input.waybillNumbers) || input.waybillNumbers.length === 0) {
    throw validationError("waybillNumbers must contain at least one waybill number.");
  }

  if (input.waybillNumbers.length > 20) {
    throw validationError("waybillNumbers must contain at most 20 waybill numbers.");
  }
}

export function assertValidModifyWeightRequest(input: ModifyWeightRequest): void {
  assertWaybillNumber(input.waybillNumber);

  if (!Number.isFinite(input.weight) || input.weight < 0.001 || input.weight > 1000) {
    throw validationError("weight must be between 0.001 and 1000.");
  }
}

export function assertValidCancelOrderRequest(input: CancelOrderRequest): void {
  assertWaybillNumber(input.waybillNumber);
}

export function assertValidHoldOrderRequest(input: HoldOrderRequest): void {
  assertWaybillNumber(input.waybillNumber);

  if (input.remark !== undefined && input.remark.length > 255) {
    throw validationError("remark must be at most 255 characters.");
  }
}

export function assertValidGetPickupPointsRequest(input: GetPickupPointsRequest): void {
  if (!input.countryCode.trim()) {
    throw validationError("countryCode is required.");
  }
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

function assertWaybillNumber(waybillNumber: string): void {
  const trimmed = waybillNumber.trim();

  if (!trimmed) {
    throw validationError("waybillNumber is required.");
  }

  if (trimmed.length > 50) {
    throw validationError("waybillNumber must be between 1 and 50 characters.");
  }
}

function validatePackageWeight(weight: number, index: number): void {
  if (!Number.isFinite(weight) || weight <= 0) {
    throw validationError(`packages[${index}].weight must be greater than 0.`);
  }

  const decimals = countDecimals(weight);
  if (decimals > 3) {
    throw validationError(`packages[${index}].weight must use at most 3 decimal places.`);
  }
}

function countDecimals(value: number): number {
  const normalized = value.toString().toLowerCase();

  if (normalized.includes("e-")) {
    const [, exponent] = normalized.split("e-");
    return Number(exponent);
  }

  const fraction = normalized.split(".")[1];
  return fraction ? fraction.length : 0;
}

function validationError(message: string): RequestExecutionError {
  return new RequestExecutionError(message, {
    code: "VALIDATION_ERROR",
  });
}
