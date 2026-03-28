import { RequestExecutionError } from "../../errors/RequestExecutionError.ts";

export interface ReleaseIssueRequest {
  waybillNumber: string;
  remark?: string;
  newWaybillNumbers?: string[];
  extraCodes?: Array<"203" | "204" | "205" | "206">;
}

export function assertValidReleaseIssueRequest(input: ReleaseIssueRequest): void {
  const waybillNumber = input.waybillNumber.trim();

  if (!waybillNumber) {
    throw validationError("waybillNumber is required.");
  }

  if (waybillNumber.length > 50) {
    throw validationError("waybillNumber must be between 1 and 50 characters.");
  }

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

function validationError(message: string): RequestExecutionError {
  return new RequestExecutionError(message, {
    code: "VALIDATION_ERROR",
  });
}
