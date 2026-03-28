export { YunExpressClient } from "./client/YunExpressClient.ts";

export type {
  ApiEnvelope,
  ProductionAuthOptions,
  ResolvedYunExpressClientOptions,
  SandboxAuthOptions,
  YunExpressAuthOptions,
  YunExpressClientOptions,
  YunExpressEnvironment,
  YunExpressLogger,
} from "./config/types.ts";
export { DEFAULT_BASE_URLS } from "./config/types.ts";

export {
  buildAuthHeaders,
  createAuthProvider,
  type AccessTokenContext,
  type AccessTokenProvider,
  type AuthHeaders,
  type AuthProvider,
  type AuthRequestContext,
} from "./auth/AuthProvider.ts";
export { NoopRequestSigner } from "./auth/signing/RequestSigner.ts";
export type { RequestSigner, SignerContext } from "./auth/signing/RequestSigner.ts";

export { DefaultApiEnvelopeParser } from "./http/responseParser.ts";
export type { ApiEnvelopeParser } from "./http/responseParser.ts";
export {
  DEFAULT_RETRY_POLICY,
  YunExpressTransport,
  normalizeRetryPolicy,
  type FetchLike,
  type HttpMethod,
  type PreparedRequest,
  type QueryParamValue,
  type QueryParams,
  type RequestInterceptor,
  type ResponseInterceptor,
  type RetryPolicy,
  type RetryPolicyInput,
  type TransportRequest,
  type TransportRequestContext,
  type TransportRequestOptions,
  type TransportResponse,
} from "./http/transport.ts";

export { OrdersResource } from "./resources/orders/OrdersResource.ts";
export { ResourceNamespace } from "./resources/ResourceNamespace.ts";
export type {
  ContactParty,
  CreatePackagePackage,
  CreatePackageRequest,
  CreatePackageResponse,
  DeclarationItem,
  PackageDimensions,
  SizeUnit,
  WeightUnit,
} from "./resources/orders/types.ts";
export { assertValidCreatePackageRequest } from "./resources/orders/types.ts";

export {
  AuthenticationError,
  RateLimitError,
  RequestExecutionError,
  UpstreamApiError,
  YunExpressError,
} from "./errors/index.ts";
export type { YunExpressErrorOptions } from "./errors/index.ts";
