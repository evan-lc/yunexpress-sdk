import { RequestExecutionError } from "../../errors/RequestExecutionError.ts";

export interface GetBillingDetailRequest {
  billCode: string;
  billType: BillingDetailType;
  pageNo?: number;
  pageSize?: number;
}

export type BillingDetailType = "I" | "Q" | "T" | "N" | "K" | "C" | "R" | "V" | "TJ" | "TT";

export type BillingDetailItem = {
  waybill_number?: string;
  customer_order_number?: string;
  customer_code?: string;
  customer_name?: string;
  reporting_currency?: string;
  total_fee?: number;
  remark?: string;
} & Record<string, unknown>;

export type GetBillingDetailResponse = {
  receipt?: BillingDetailItem[] | Record<string, unknown> | null;
  expenditure_records?: BillingDetailItem[] | null;
  additional_surcharge?: BillingDetailItem[] | Record<string, unknown> | null;
  correct_record?: BillingDetailItem[] | Record<string, unknown> | null;
  return_record?: BillingDetailItem[] | Record<string, unknown> | null;
  vat_records?: BillingDetailItem[] | Record<string, unknown> | null;
  transfer_tracking?: BillingDetailItem[] | Record<string, unknown> | null;
  return_order?: BillingDetailItem[] | Record<string, unknown> | null;
  clearance_record?: BillingDetailItem[] | Record<string, unknown> | null;
  transfer_record?: BillingDetailItem[] | Record<string, unknown> | null;
} & Record<string, unknown>;

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

const BILLING_DETAIL_TYPES = new Set<BillingDetailType>([
  "I",
  "Q",
  "T",
  "N",
  "K",
  "C",
  "R",
  "V",
  "TJ",
  "TT",
]);

export function assertValidGetBillingDetailRequest(input: GetBillingDetailRequest): void {
  if (!input.billCode.trim()) {
    throw new RequestExecutionError("billCode is required.", {
      code: "VALIDATION_ERROR",
    });
  }

  if (!input.billType.trim()) {
    throw new RequestExecutionError("billType is required.", {
      code: "VALIDATION_ERROR",
    });
  }

  if (!BILLING_DETAIL_TYPES.has(input.billType)) {
    throw new RequestExecutionError("billType must be one of I, Q, T, N, K, C, R, V, TJ, TT.", {
      code: "VALIDATION_ERROR",
    });
  }

  if (
    input.pageNo !== undefined &&
    (!Number.isInteger(input.pageNo) || input.pageNo < 1 || input.pageNo > 100_000)
  ) {
    throw new RequestExecutionError("pageNo must be an integer between 1 and 100000.", {
      code: "VALIDATION_ERROR",
    });
  }

  if (
    input.pageSize !== undefined &&
    (!Number.isInteger(input.pageSize) || input.pageSize < 1 || input.pageSize > 100)
  ) {
    throw new RequestExecutionError("pageSize must be an integer between 1 and 100.", {
      code: "VALIDATION_ERROR",
    });
  }
}

export function assertValidGetFreightDetailRequest(input: GetFreightDetailRequest): void {
  if (!input.waybillNumber.trim()) {
    throw new RequestExecutionError("waybillNumber is required.", {
      code: "VALIDATION_ERROR",
    });
  }
}
