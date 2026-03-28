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
