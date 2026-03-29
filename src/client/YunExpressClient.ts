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
import { B2BResource } from "../resources/b2b/B2BResource.ts";
import { BasicResource } from "../resources/basic/BasicResource.ts";
import { BillingResource } from "../resources/billing/BillingResource.ts";
import { ExceptionsResource } from "../resources/exceptions/ExceptionsResource.ts";
import { LabelsResource } from "../resources/labels/LabelsResource.ts";
import { OrdersResource } from "../resources/orders/OrdersResource.ts";
import { PricingResource } from "../resources/pricing/PricingResource.ts";
import { ReturnsResource } from "../resources/returns/ReturnsResource.ts";
import { TrackingResource } from "../resources/tracking/TrackingResource.ts";

export class YunExpressClient {
  readonly b2b: B2BResource;
  readonly orders: OrdersResource;
  readonly labels: LabelsResource;
  readonly tracking: TrackingResource;
  readonly pricing: PricingResource;
  readonly exceptions: ExceptionsResource;
  readonly returns: ReturnsResource;
  readonly billing: BillingResource;
  readonly basic: BasicResource;

  private readonly transport: YunExpressTransport;
  private readonly options: ResolvedYunExpressClientOptions;

  constructor(options: YunExpressClientOptions) {
    this.options = resolveClientOptions(options);
    this.transport = new YunExpressTransport(this.options);

    this.b2b = new B2BResource(this);
    this.orders = new OrdersResource(this);
    this.labels = new LabelsResource(this);
    this.tracking = new TrackingResource(this);
    this.pricing = new PricingResource(this);
    this.exceptions = new ExceptionsResource(this);
    this.returns = new ReturnsResource(this);
    this.billing = new BillingResource(this);
    this.basic = new BasicResource(this);
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
