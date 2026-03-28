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
