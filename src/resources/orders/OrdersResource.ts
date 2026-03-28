import type { YunExpressClient } from "../../client/YunExpressClient.ts";
import type { TransportRequestOptions, TransportResponse } from "../../http/transport.ts";
import { ResourceNamespace } from "../ResourceNamespace.ts";
import {
  assertValidCreatePackageRequest,
  assertValidGetWaybillDetailRequest,
  type CreatePackageRequest,
  type CreatePackageResponse,
  type GetWaybillDetailRequest,
  type GetWaybillDetailResponse,
} from "./types.ts";

export class OrdersResource extends ResourceNamespace {
  constructor(client: YunExpressClient) {
    super(client, "orders");
  }

  createPackage(
    input: CreatePackageRequest,
    options: TransportRequestOptions = {},
  ): Promise<TransportResponse<CreatePackageResponse>> {
    assertValidCreatePackageRequest(input);

    return this.request<CreatePackageResponse, CreatePackageRequest>({
      ...options,
      method: "POST",
      path: "/v1/order/package/create",
      body: input,
    });
  }

  getWaybillDetail(
    input: GetWaybillDetailRequest,
    options: TransportRequestOptions = {},
  ): Promise<TransportResponse<GetWaybillDetailResponse>> {
    assertValidGetWaybillDetailRequest(input);

    return this.request<GetWaybillDetailResponse>({
      ...options,
      method: "GET",
      path: "/v1/order/info/get",
      query: {
        ...options.query,
        order_number: input.orderNumber,
      },
    });
  }
}
