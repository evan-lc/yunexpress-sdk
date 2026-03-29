import type { YunExpressClient } from "../../client/YunExpressClient.ts";
import type { TransportRequestOptions, TransportResponse } from "../../http/transport.ts";
import { ResourceNamespace } from "../ResourceNamespace.ts";
import type { GetCountryCodesResponse, GetProductsRequest, GetProductsResponse } from "./types.ts";

export class BasicResource extends ResourceNamespace {
  constructor(client: YunExpressClient) {
    super(client, "basic");
  }

  getCountryCodes(
    options: TransportRequestOptions = {},
  ): Promise<TransportResponse<GetCountryCodesResponse>> {
    return this.request<GetCountryCodesResponse | { list?: GetCountryCodesResponse }>({
      ...options,
      method: "GET",
      path: "/v1/basic-data/countries/getlist",
    }).then((response) =>
      normalizeArrayResponse(response, (value) => {
        if (Array.isArray(value)) {
          return value as GetCountryCodesResponse;
        }

        if (
          value &&
          typeof value === "object" &&
          Array.isArray((value as { list?: unknown }).list)
        ) {
          return (value as { list: GetCountryCodesResponse }).list;
        }

        return [];
      }),
    );
  }

  getProducts(
    inputOrOptions: GetProductsRequest | TransportRequestOptions = {},
    options: TransportRequestOptions = {},
  ): Promise<TransportResponse<GetProductsResponse>> {
    const [input, requestOptions] = isTransportRequestOptions(inputOrOptions)
      ? [{}, inputOrOptions]
      : [inputOrOptions, options];

    return this.request<GetProductsResponse>({
      ...requestOptions,
      method: "GET",
      path: "/v1/basic-data/products/getlist",
      query: {
        ...requestOptions.query,
        country_code: input.countryCode,
      },
    }).then((response) =>
      normalizeArrayResponse(response, (_value, rawBody) => {
        if (rawBody && typeof rawBody === "object" && !Array.isArray(rawBody)) {
          const detail = (rawBody as { detail?: unknown }).detail;
          if (Array.isArray(detail)) {
            return detail as GetProductsResponse;
          }
        }

        return [];
      }),
    );
  }
}

function isTransportRequestOptions(
  value: GetProductsRequest | TransportRequestOptions,
): value is TransportRequestOptions {
  return (
    "headers" in value ||
    "query" in value ||
    "timeoutMs" in value ||
    "retries" in value ||
    "idempotencyKey" in value ||
    "signal" in value
  );
}

function normalizeArrayResponse<TArray extends unknown[]>(
  response: TransportResponse<unknown>,
  extract: (data: unknown, rawBody: unknown) => TArray,
): TransportResponse<TArray> {
  const normalized = extract(response.data, response.rawBody);

  return {
    ...response,
    data: normalized,
    envelope: {
      ...response.envelope,
      result: normalized,
    },
  } as TransportResponse<TArray>;
}
