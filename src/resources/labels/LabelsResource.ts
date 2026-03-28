import type { YunExpressClient } from "../../client/YunExpressClient.ts";
import type { TransportRequestOptions, TransportResponse } from "../../http/transport.ts";
import { ResourceNamespace } from "../ResourceNamespace.ts";
import {
  assertValidOrderNumberRequest,
  type GetLabelRequest,
  type GetPodRequest,
  type GetShippingDocsRequest,
  type LabelResponse,
} from "./types.ts";

export class LabelsResource extends ResourceNamespace {
  constructor(client: YunExpressClient) {
    super(client, "labels");
  }

  getLabel(
    input: GetLabelRequest,
    options: TransportRequestOptions = {},
  ): Promise<TransportResponse<LabelResponse>> {
    assertValidOrderNumberRequest(input);

    return this.request<LabelResponse>({
      ...options,
      method: "GET",
      path: "/v1/order/label/get",
      query: {
        ...options.query,
        order_number: input.orderNumber,
      },
    });
  }

  getShippingDocs(
    input: GetShippingDocsRequest,
    options: TransportRequestOptions = {},
  ): Promise<TransportResponse<LabelResponse>> {
    assertValidOrderNumberRequest(input);

    return this.request<LabelResponse>({
      ...options,
      method: "GET",
      path: "/v1/order/shipping-docs/get",
      query: {
        ...options.query,
        order_number: input.orderNumber,
      },
    });
  }

  getPod(
    input: GetPodRequest,
    options: TransportRequestOptions = {},
  ): Promise<TransportResponse<LabelResponse>> {
    assertValidOrderNumberRequest(input);

    return this.request<LabelResponse>({
      ...options,
      method: "GET",
      path: "/v1/order/pod/get",
      query: {
        ...options.query,
        order_number: input.orderNumber,
      },
    });
  }
}
