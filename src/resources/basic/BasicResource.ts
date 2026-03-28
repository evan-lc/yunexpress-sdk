import type { YunExpressClient } from "../../client/YunExpressClient.ts";
import type { TransportRequestOptions, TransportResponse } from "../../http/transport.ts";
import { ResourceNamespace } from "../ResourceNamespace.ts";
import type { GetCountryCodesResponse, GetProductsResponse } from "./types.ts";

export class BasicResource extends ResourceNamespace {
  constructor(client: YunExpressClient) {
    super(client, "basic");
  }

  getCountryCodes(
    options: TransportRequestOptions = {},
  ): Promise<TransportResponse<GetCountryCodesResponse>> {
    return this.request<GetCountryCodesResponse>({
      ...options,
      method: "GET",
      path: "/v1/basic/country/get",
    });
  }

  getProducts(
    options: TransportRequestOptions = {},
  ): Promise<TransportResponse<GetProductsResponse>> {
    return this.request<GetProductsResponse>({
      ...options,
      method: "GET",
      path: "/v1/basic/product/get",
    });
  }
}
