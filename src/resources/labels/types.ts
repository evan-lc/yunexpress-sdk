import { RequestExecutionError } from "../../errors/RequestExecutionError.ts";

export interface GetLabelRequest {
  orderNumber: string;
}

export interface GetShippingDocsRequest {
  orderNumber: string;
}

export interface GetPodRequest {
  orderNumber: string;
}

export type LabelResponse = {
  order_number?: string;
  url?: string;
  label_type?: string;
  label_string?: string;
} & Record<string, unknown>;

export function assertValidOrderNumberRequest(input: { orderNumber: string }): void {
  const orderNumber = input.orderNumber.trim();

  if (!orderNumber) {
    throw new RequestExecutionError("orderNumber is required.", {
      code: "VALIDATION_ERROR",
    });
  }

  if (orderNumber.length > 50) {
    throw new RequestExecutionError("orderNumber must be between 1 and 50 characters.", {
      code: "VALIDATION_ERROR",
    });
  }
}
