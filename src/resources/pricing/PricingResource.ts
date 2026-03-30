import type { YunExpressClient } from "../../client/YunExpressClient.ts";
import type { TransportRequestOptions, TransportResponse } from "../../http/transport.ts";
import { ResourceNamespace } from "../ResourceNamespace.ts";
import {
  assertValidGetPriceTrialRequest,
  assertValidGetPriceTrialV2Request,
  type GetPriceTrialRequest,
  type GetPriceTrialResponse,
  type GetPriceTrialV2Request,
  type GetPriceTrialV2Response,
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

  getPriceTrialV2(
    input: GetPriceTrialV2Request,
    options: TransportRequestOptions = {},
  ): Promise<TransportResponse<GetPriceTrialV2Response>> {
    assertValidGetPriceTrialV2Request(input);

    return this.request<GetPriceTrialV2Response>({
      ...options,
      method: "POST",
      path: "/v1/price-trial/get_V2",
      body: {
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
        income_type: input.incomeType,
        detail_entities: input.detailEntities,
      },
    });
  }
}
