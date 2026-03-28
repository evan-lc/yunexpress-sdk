import type { YunExpressClient } from "../../client/YunExpressClient.ts";
import type { TransportRequestOptions, TransportResponse } from "../../http/transport.ts";
import { ResourceNamespace } from "../ResourceNamespace.ts";
import {
  assertValidCreatePackageRequest,
  type CreatePackageRequest,
  type CreatePackageResponse,
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
}
