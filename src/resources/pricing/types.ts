import { RequestExecutionError } from "../../errors/RequestExecutionError.ts";

export interface GetPriceTrialRequest {
  countryCode: string;
  weight: number;
  weightUnit?: "G" | "KG" | "LBS";
  packageType?: "C" | "E" | "F";
  postalCode?: string;
  productGroupCode?: string;
  pieces?: number;
  length?: number;
  width?: number;
  height?: number;
  sizeUnit?: "CM" | "INCH";
  origin?: string;
}

export interface GetPriceTrialV2Request extends GetPriceTrialRequest {
  incomeType?: string;
  detailEntities?: PriceTrialV2DetailEntity[];
}

export type PriceTrialV2DetailEntity = Record<string, unknown>;

export type PriceTrialItem = {
  product_code?: string;
  product_name?: string;
  fee_name?: string;
  calculate_amount?: number;
  currency?: string;
  interval_day?: string;
  price_name?: string;
  price_type?: string;
  convert_currency?: string;
  rate?: number;
  convert_amount?: number;
} & Record<string, unknown>;

export type GetPriceTrialResponse = PriceTrialItem[];

export type GetPriceTrialV2Response = PriceTrialItem[];

export function assertValidGetPriceTrialRequest(input: GetPriceTrialRequest): void {
  if (!input.countryCode.trim() || input.countryCode.length !== 2) {
    throw new RequestExecutionError("countryCode must be a 2-letter ISO country code.", {
      code: "VALIDATION_ERROR",
    });
  }

  if (!Number.isFinite(input.weight) || input.weight < 0.001 || input.weight > 1000) {
    throw new RequestExecutionError("weight must be between 0.001 and 1000.", {
      code: "VALIDATION_ERROR",
    });
  }
}

export function assertValidGetPriceTrialV2Request(input: GetPriceTrialV2Request): void {
  assertValidGetPriceTrialRequest(input);

  if (input.incomeType !== undefined && !input.incomeType.trim()) {
    throw new RequestExecutionError("incomeType cannot be empty when provided.", {
      code: "VALIDATION_ERROR",
    });
  }

  if (input.incomeType === "B2B") {
    if (!Array.isArray(input.detailEntities) || input.detailEntities.length === 0) {
      throw new RequestExecutionError(
        "detailEntities must contain at least one item when incomeType is B2B.",
        {
          code: "VALIDATION_ERROR",
        },
      );
    }
  } else if (input.detailEntities !== undefined && !Array.isArray(input.detailEntities)) {
    throw new RequestExecutionError("detailEntities must be an array when provided.", {
      code: "VALIDATION_ERROR",
    });
  }
}
