import { RequestExecutionError } from "../../errors/RequestExecutionError.ts";

export type CountryItem = {
  country_code?: string;
  country_name?: string;
  country_name_en?: string;
  country_code_three?: string;
  country_number?: number;
  international_code?: string;
} & Record<string, unknown>;

export type GetCountryCodesResponse = CountryItem[];

export interface GetProductsRequest {
  countryCode?: string;
}

export interface RegisterIossRequest {
  iossNumber: string;
  iossType: "S" | "P";
  platformName?: string;
  iossName?: string;
  company?: string;
  countryCode?: string;
  street?: string;
  city?: string;
  province?: string;
  postalCode?: string;
  phoneNumber?: string;
  email?: string;
  fileUrls?: string[];
}

export interface RegisterVatRequest {
  vatNumber: string;
  eoriNumber: string;
  countryCode: string;
  importerName: string;
  importerAddress: string;
}

export type ProductItem = {
  product_code?: string;
  product_name?: string;
  product_group_code?: string;
} & Record<string, unknown>;

export type GetProductsResponse = ProductItem[];

export function assertValidRegisterIossRequest(input: RegisterIossRequest): void {
  assertRequiredString(input.iossNumber, "iossNumber");

  if (!["S", "P"].includes(input.iossType)) {
    throw validationError("iossType must be S or P.");
  }

  if (input.iossType === "P") {
    assertRequiredString(input.platformName ?? "", "platformName");
  }

  if (input.countryCode !== undefined) {
    assertCountryCode(input.countryCode, "countryCode");
  }

  if (input.fileUrls !== undefined) {
    if (!Array.isArray(input.fileUrls)) {
      throw validationError("fileUrls must be an array when provided.");
    }

    input.fileUrls.forEach((value, index) => {
      assertRequiredString(value, `fileUrls[${index}]`);
    });
  }
}

export function assertValidRegisterVatRequest(input: RegisterVatRequest): void {
  assertRequiredString(input.vatNumber, "vatNumber");
  assertRequiredString(input.eoriNumber, "eoriNumber");
  assertCountryCode(input.countryCode, "countryCode");
  assertRequiredString(input.importerName, "importerName");
  assertRequiredString(input.importerAddress, "importerAddress");
}

function assertRequiredString(value: string, fieldName: string): void {
  if (!value.trim()) {
    throw validationError(`${fieldName} is required.`);
  }
}

function assertCountryCode(value: string, fieldName: string): void {
  const trimmed = value.trim();

  if (!trimmed) {
    throw validationError(`${fieldName} is required.`);
  }

  if (trimmed.length !== 2) {
    throw validationError(`${fieldName} must be a 2-letter country code.`);
  }
}

function validationError(message: string): RequestExecutionError {
  return new RequestExecutionError(message, {
    code: "VALIDATION_ERROR",
  });
}
