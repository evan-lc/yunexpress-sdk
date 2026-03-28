import type { YunExpressClient } from "../../client/YunExpressClient.ts";
import type { TransportRequestOptions, TransportResponse } from "../../http/transport.ts";
import { ResourceNamespace } from "../ResourceNamespace.ts";
import {
  assertValidGetFreightDetailRequest,
  type GetBillingDetailRequest,
  type GetBillingDetailResponse,
  type GetFreightDetailRequest,
  type GetFreightDetailResponse,
} from "./types.ts";

export class BillingResource extends ResourceNamespace {
  constructor(client: YunExpressClient) {
    super(client, "billing");
  }

  getBillingDetail(
    input: GetBillingDetailRequest = {},
    options: TransportRequestOptions = {},
  ): Promise<TransportResponse<GetBillingDetailResponse>> {
    return this.request<GetBillingDetailResponse>({
      ...options,
      method: "GET",
      path: "/v1/billing/detail/get",
      query: {
        ...options.query,
        waybill_number: input.waybillNumber,
        start_date: input.startDate,
        end_date: input.endDate,
        page: input.page,
        page_size: input.pageSize,
      },
    });
  }

  getFreightDetail(
    input: GetFreightDetailRequest,
    options: TransportRequestOptions = {},
  ): Promise<TransportResponse<GetFreightDetailResponse>> {
    assertValidGetFreightDetailRequest(input);

    return this.request<GetFreightDetailResponse>({
      ...options,
      method: "GET",
      path: "/v1/freight/detail/get",
      query: {
        ...options.query,
        waybill_number: input.waybillNumber,
      },
    });
  }
}
