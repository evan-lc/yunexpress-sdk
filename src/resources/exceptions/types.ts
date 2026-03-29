import { RequestExecutionError } from "../../errors/RequestExecutionError.ts";

export interface ReleaseIssueRequest {
  waybillNumber: string;
  remark?: string;
  newWaybillNumbers?: string[];
  extraCodes?: Array<"203" | "204" | "205" | "206">;
}

export interface MarkIssueReadRequest {
  waybillNumber: string;
}

export interface GetIssueOptionsRequest {
  waybillNumber: string;
}

export interface GetIssueOrderDetailRequest {
  waybillNumber: string;
}

export type IssueReceiveAddressItem = {
  warehouse_code?: string;
  warehouse_name?: string;
  address?: string;
  first_name?: string;
  phone_number?: string;
} & Record<string, unknown>;

export type GetIssueReceiveAddressesResponse = IssueReceiveAddressItem[];

export type IssueOptionItem = {
  plan_code?: string;
  plan_name?: string;
} & Record<string, unknown>;

export type GetIssueOptionsResponse = IssueOptionItem[];

export type GetIssueOrderDetailResponse = {
  waybill_number?: string;
  parent_waybill_number?: string | null;
  customer_order_number?: string;
  tracking_number?: string | null;
  product_code?: string;
  country_code?: string;
  wo_info?: Array<Record<string, unknown>>;
  operation_info?: Array<Record<string, unknown>>;
  return_info?: Record<string, unknown> | null;
  func_btn_list?: Array<Record<string, unknown>>;
} & Record<string, unknown>;

export function assertValidReleaseIssueRequest(input: ReleaseIssueRequest): void {
  assertWaybillNumber(input.waybillNumber);

  if (input.remark !== undefined && input.remark.length > 255) {
    throw validationError("remark must be at most 255 characters.");
  }

  if (input.newWaybillNumbers !== undefined && input.newWaybillNumbers.length > 100) {
    throw validationError("newWaybillNumbers must contain at most 100 items.");
  }

  if (input.extraCodes) {
    const hasSplit = input.extraCodes.includes("205");
    const hasMerge = input.extraCodes.includes("204");

    if (hasSplit && hasMerge) {
      throw validationError("Split (205) and Merge (204) are mutually exclusive.");
    }
  }
}

export function assertValidMarkIssueReadRequest(input: MarkIssueReadRequest): void {
  assertWaybillNumber(input.waybillNumber);
}

export function assertValidGetIssueOptionsRequest(input: GetIssueOptionsRequest): void {
  assertWaybillNumber(input.waybillNumber);
}

export function assertValidGetIssueOrderDetailRequest(input: GetIssueOrderDetailRequest): void {
  assertWaybillNumber(input.waybillNumber);
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

function validationError(message: string): RequestExecutionError {
  return new RequestExecutionError(message, {
    code: "VALIDATION_ERROR",
  });
}
