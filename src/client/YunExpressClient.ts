import { createAuthProvider } from "../auth/AuthProvider.ts";
import {
  DEFAULT_BASE_URLS,
  type ResolvedYunExpressClientOptions,
  type YunExpressClientOptions,
  type YunExpressEnvironment,
} from "../config/types.ts";
import { DefaultApiEnvelopeParser } from "../http/responseParser.ts";
import {
  DEFAULT_RETRY_POLICY,
  YunExpressTransport,
  normalizeRetryPolicy,
  type TransportRequest,
  type TransportResponse,
} from "../http/transport.ts";
import { ResourceNamespace } from "../resources/ResourceNamespace.ts";
import { OrdersResource } from "../resources/orders/OrdersResource.ts";

export class YunExpressClient {
  readonly orders: OrdersResource;
  readonly labels: ResourceNamespace;
  readonly tracking: ResourceNamespace;
  readonly pricing: ResourceNamespace;
  readonly catalog: ResourceNamespace;
  readonly compliance: ResourceNamespace;
  readonly exceptions: ResourceNamespace;
  readonly apiSeries: ResourceNamespace;
  readonly b2b: ResourceNamespace;
  readonly returns: ResourceNamespace;

  private readonly transport: YunExpressTransport;
  private readonly options: ResolvedYunExpressClientOptions;

  constructor(options: YunExpressClientOptions) {
    this.options = resolveClientOptions(options);
    this.transport = new YunExpressTransport(this.options);

    this.orders = new OrdersResource(this);
    this.labels = new ResourceNamespace(this, "labels");
    this.tracking = new ResourceNamespace(this, "tracking");
    this.pricing = new ResourceNamespace(this, "pricing");
    this.catalog = new ResourceNamespace(this, "catalog");
    this.compliance = new ResourceNamespace(this, "compliance");
    this.exceptions = new ResourceNamespace(this, "exceptions");
    this.apiSeries = new ResourceNamespace(this, "apiSeries");
    this.b2b = new ResourceNamespace(this, "b2b");
    this.returns = new ResourceNamespace(this, "returns");
  }

  get environment(): YunExpressEnvironment {
    return this.options.environment;
  }

  get baseUrl(): string {
    return this.options.baseUrl;
  }

  request<TResponse, TBody = unknown>(
    request: TransportRequest<TBody>,
  ): Promise<TransportResponse<TResponse>> {
    return this.transport.execute<TResponse, TBody>(request);
  }

  async invoke<TResponse, TBody = unknown>(request: TransportRequest<TBody>): Promise<TResponse> {
    const response = await this.request<TResponse, TBody>(request);
    return response.data;
  }
}

function resolveClientOptions(options: YunExpressClientOptions): ResolvedYunExpressClientOptions {
  const environment = options.environment ?? options.auth.kind;
  if (environment !== options.auth.kind) {
    throw new TypeError(
      `Environment ${environment} does not match auth kind ${options.auth.kind}.`,
    );
  }

  const fetchImplementation = options.fetch ?? globalThis.fetch?.bind(globalThis);
  if (!fetchImplementation) {
    throw new TypeError(
      "Global fetch is unavailable. Use Node 18+ or pass a custom fetch implementation.",
    );
  }

  const authProvider =
    options.authProvider ??
    createAuthProvider(environment, options.auth, {
      fetch: fetchImplementation,
      logger: options.logger,
    });

  return {
    environment,
    authProvider,
    baseUrl: normalizeBaseUrl(options.baseUrl ?? DEFAULT_BASE_URLS[environment]),
    timeoutMs: options.timeoutMs ?? 10_000,
    retries: normalizeRetryPolicy(options.retries, DEFAULT_RETRY_POLICY),
    debug: options.debug ?? false,
    logger: options.logger,
    headers: { ...options.headers },
    fetch: fetchImplementation,
    responseParser: options.responseParser ?? new DefaultApiEnvelopeParser(),
    requestInterceptors: [...(options.requestInterceptors ?? [])],
    responseInterceptors: [...(options.responseInterceptors ?? [])],
  };
}

function normalizeBaseUrl(baseUrl: string): string {
  return baseUrl.endsWith("/") ? baseUrl.slice(0, -1) : baseUrl;
}
