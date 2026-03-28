import type { YunExpressClient } from "../../client/YunExpressClient.ts";
import type { TransportRequestOptions, TransportResponse } from "../../http/transport.ts";
import { ResourceNamespace } from "../ResourceNamespace.ts";
import { assertValidReleaseIssueRequest, type ReleaseIssueRequest } from "./types.ts";

export class ExceptionsResource extends ResourceNamespace {
  constructor(client: YunExpressClient) {
    super(client, "exceptions");
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
}
