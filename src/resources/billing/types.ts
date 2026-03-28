import { RequestExecutionError } from "../../errors/RequestExecutionError.ts";

export interface GetBillingDetailRequest {
  waybillNumber?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  pageSize?: number;
}

export type BillingDetailItem = {
  waybill_number?: string;
  fee_name?: string;
  fee_amount?: number;
  currency?: string;
  billing_date?: string;
} & Record<string, unknown>;

export type GetBillingDetailResponse = BillingDetailItem[];

export interface GetFreightDetailRequest {
  waybillNumber: string;
}

export type FreightFeeDetail = {
  fee_name?: string;
  fee_amount?: number;
} & Record<string, unknown>;

export type GetFreightDetailResponse = {
  waybill_number?: string;
  total_amount?: number;
  currency?: string;
  fee_details?: FreightFeeDetail[];
} & Record<string, unknown>;

export function assertValidGetFreightDetailRequest(input: GetFreightDetailRequest): void {
  if (!input.waybillNumber.trim()) {
    throw new RequestExecutionError("waybillNumber is required.", {
      code: "VALIDATION_ERROR",
    });
  }
}
