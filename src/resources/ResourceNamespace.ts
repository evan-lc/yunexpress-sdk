import type { YunExpressClient } from "../client/YunExpressClient.ts";
import type { TransportRequest, TransportResponse } from "../http/transport.ts";

export class ResourceNamespace {
  constructor(
    protected readonly client: YunExpressClient,
    readonly namespace: string,
  ) {}

  request<TResponse, TBody = unknown>(
    request: TransportRequest<TBody>,
  ): Promise<TransportResponse<TResponse>> {
    return this.client.request<TResponse, TBody>(request);
  }

  async invoke<TResponse, TBody = unknown>(request: TransportRequest<TBody>): Promise<TResponse> {
    return this.client.invoke<TResponse, TBody>(request);
  }
}
