import type { YunExpressClient } from "../../client/YunExpressClient.ts";
import type { TransportRequestOptions, TransportResponse } from "../../http/transport.ts";
import { ResourceNamespace } from "../ResourceNamespace.ts";
import {
  assertValidRegisterIossRequest,
  assertValidRegisterVatRequest,
  type GetCountryCodesResponse,
  type GetProductsRequest,
  type GetProductsResponse,
  type RegisterIossRequest,
  type RegisterVatRequest,
} from "./types.ts";

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

  registerIoss(
    input: RegisterIossRequest,
    options: TransportRequestOptions = {},
  ): Promise<TransportResponse<void>> {
    assertValidRegisterIossRequest(input);

    return this.request<void>({
      ...options,
      method: "POST",
      path: "/v1/precondition-service/ioss/register",
      body: {
        ioss_number: input.iossNumber,
        ioss_type: input.iossType,
        platform_name: input.platformName,
        ioss_name: input.iossName,
        company: input.company,
        country_code: input.countryCode,
        street: input.street,
        city: input.city,
        province: input.province,
        postal_code: input.postalCode,
        phone_number: input.phoneNumber,
        email: input.email,
        file_url: input.fileUrls,
      },
    });
  }

  registerVat(
    input: RegisterVatRequest,
    options: TransportRequestOptions = {},
  ): Promise<TransportResponse<void>> {
    assertValidRegisterVatRequest(input);

    return this.request<void>({
      ...options,
      method: "POST",
      path: "/v1/precondition-service/vat/register",
      body: {
        vat_number: input.vatNumber,
        eori_number: input.eoriNumber,
        country_code: input.countryCode,
        importer_name: input.importerName,
        importer_address: input.importerAddress,
      },
    });
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
