import type { YunExpressClient } from "../../client/YunExpressClient.ts";
import type { TransportRequestOptions, TransportResponse } from "../../http/transport.ts";
import { ResourceNamespace } from "../ResourceNamespace.ts";
import {
  assertValidGetPriceTrialRequest,
  type GetPriceTrialRequest,
  type GetPriceTrialResponse,
} from "./types.ts";

export class PricingResource extends ResourceNamespace {
  constructor(client: YunExpressClient) {
    super(client, "pricing");
  }

  getPriceTrial(
    input: GetPriceTrialRequest,
    options: TransportRequestOptions = {},
  ): Promise<TransportResponse<GetPriceTrialResponse>> {
    assertValidGetPriceTrialRequest(input);

    return this.request<GetPriceTrialResponse>({
      ...options,
      method: "GET",
      path: "/v1/price-trial/get",
      query: {
        ...options.query,
        country_code: input.countryCode,
        weight: input.weight,
        weight_unit: input.weightUnit,
        package_type: input.packageType,
        postal_code: input.postalCode,
        product_group_code: input.productGroupCode,
        pieces: input.pieces,
        length: input.length,
        width: input.width,
        height: input.height,
        size_unit: input.sizeUnit,
        origin: input.origin,
      },
    });
  }
}
