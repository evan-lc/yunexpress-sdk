import type { YunExpressClient } from "../../client/YunExpressClient.ts";
import type { TransportRequestOptions, TransportResponse } from "../../http/transport.ts";
import { ResourceNamespace } from "../ResourceNamespace.ts";
import {
  assertValidGetIssueOptionsRequest,
  assertValidGetIssueOrderDetailRequest,
  assertValidMarkIssueReadRequest,
  assertValidReleaseIssueRequest,
  type GetIssueOptionsRequest,
  type GetIssueOptionsResponse,
  type GetIssueOrderDetailRequest,
  type GetIssueOrderDetailResponse,
  type GetIssueReceiveAddressesResponse,
  type MarkIssueReadRequest,
  type ReleaseIssueRequest,
} from "./types.ts";

export class ExceptionsResource extends ResourceNamespace {
  constructor(client: YunExpressClient) {
    super(client, "exceptions");
  }

  getReceiveAddresses(
    options: TransportRequestOptions = {},
  ): Promise<TransportResponse<GetIssueReceiveAddressesResponse>> {
    return this.request<GetIssueReceiveAddressesResponse>({
      ...options,
      method: "GET",
      path: "/v1/issue/get-receive-address",
    }).then((response) =>
      normalizeArrayResponse(response, (data) =>
        Array.isArray(data) ? (data as GetIssueReceiveAddressesResponse) : [],
      ),
    );
  }

  releaseIssue(
    input: ReleaseIssueRequest,
    options: TransportRequestOptions = {},
  ): Promise<TransportResponse<void>> {
    assertValidReleaseIssueRequest(input);

    return this.request<void>({
      ...options,
      method: "POST",
      path: "/v1/issue/release",
      body: {
        waybill_number: input.waybillNumber,
        remark: input.remark,
        new_waybill_numbers: input.newWaybillNumbers,
        extra_codes: input.extraCodes,
      },
    });
  }

  markAsRead(
    input: MarkIssueReadRequest,
    options: TransportRequestOptions = {},
  ): Promise<TransportResponse<void>> {
    assertValidMarkIssueReadRequest(input);

    return this.request<void>({
      ...options,
      method: "POST",
      path: "/v1/issue/read",
      body: {
        waybill_number: input.waybillNumber,
      },
    });
  }

  getOptions(
    input: GetIssueOptionsRequest,
    options: TransportRequestOptions = {},
  ): Promise<TransportResponse<GetIssueOptionsResponse>> {
    assertValidGetIssueOptionsRequest(input);

    return this.request<GetIssueOptionsResponse>({
      ...options,
      method: "GET",
      path: "/v1/issue/get-options",
      query: {
        ...options.query,
        waybill_number: input.waybillNumber,
      },
    }).then((response) =>
      normalizeArrayResponse(response, (data) =>
        Array.isArray(data) ? (data as GetIssueOptionsResponse) : [],
      ),
    );
  }

  getOrderDetail(
    input: GetIssueOrderDetailRequest,
    options: TransportRequestOptions = {},
  ): Promise<TransportResponse<GetIssueOrderDetailResponse>> {
    assertValidGetIssueOrderDetailRequest(input);

    return this.request<GetIssueOrderDetailResponse>({
      ...options,
      method: "GET",
      path: "/v1/issue/get-order-detail",
      query: {
        ...options.query,
        waybill_number: input.waybillNumber,
      },
    });
  }
}

function normalizeArrayResponse<TArray extends unknown[]>(
  response: TransportResponse<unknown>,
  extract: (data: unknown) => TArray,
): TransportResponse<TArray> {
  const normalized = extract(response.data);

  return {
    ...response,
    data: normalized,
    envelope: {
      ...response.envelope,
      result: normalized,
    },
  } as TransportResponse<TArray>;
}
