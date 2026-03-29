import type { YunExpressClient } from "../../client/YunExpressClient.ts";
import type { TransportRequestOptions, TransportResponse } from "../../http/transport.ts";
import { ResourceNamespace } from "../ResourceNamespace.ts";
import {
  assertValidGetBillingDetailRequest,
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
    input: GetBillingDetailRequest,
    options: TransportRequestOptions = {},
  ): Promise<TransportResponse<GetBillingDetailResponse>> {
    assertValidGetBillingDetailRequest(input);

    return this.request<GetBillingDetailResponse>({
      ...options,
      method: "GET",
      path: "/v1/bill/details/list",
      query: {
        ...options.query,
        bill_code: input.billCode,
        bill_type: input.billType,
        page_no: input.pageNo ?? 1,
        page_size: input.pageSize ?? 10,
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
