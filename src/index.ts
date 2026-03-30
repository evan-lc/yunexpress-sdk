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
  type CreateAuthProviderDependencies,
  type AccessTokenContext,
  type AccessTokenProvider,
  type AuthHeaders,
  type AuthProvider,
  type AuthRequestContext,
} from "./auth/AuthProvider.ts";
export { createOAuthAccessTokenProvider } from "./auth/token/createOAuthAccessTokenProvider.ts";
export type { OAuthTokenProviderOptions } from "./auth/token/createOAuthAccessTokenProvider.ts";
export { HmacSha256RequestSigner } from "./auth/signing/HmacSha256RequestSigner.ts";
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
export { LabelsResource } from "./resources/labels/LabelsResource.ts";
export { TrackingResource } from "./resources/tracking/TrackingResource.ts";
export { PricingResource } from "./resources/pricing/PricingResource.ts";
export { B2BResource } from "./resources/b2b/B2BResource.ts";
export { ExceptionsResource } from "./resources/exceptions/ExceptionsResource.ts";
export { ReturnsResource } from "./resources/returns/ReturnsResource.ts";
export { BillingResource } from "./resources/billing/BillingResource.ts";
export { BasicResource } from "./resources/basic/BasicResource.ts";
export { ResourceNamespace } from "./resources/ResourceNamespace.ts";
export type {
  B2BCollectWarehouseItem,
  B2BDeliveryInfo,
  B2BLabelResponse,
  B2BLastMileCarrierItem,
  B2BProductItem,
  B2BSelfWarehouseItem,
  B2BSecondaryAddressTypeItem,
  B2BWarehouseAddressItem,
  B2BWaybillDeclarationItem,
  B2BWaybillPackage,
  B2BWaybillParty,
  GetB2BCollectWarehousesResponse,
  GetB2BLabelRequest,
  GetB2BLastMileCarriersRequest,
  GetB2BLastMileCarriersResponse,
  GetB2BProductsRequest,
  GetB2BProductsResponse,
  GetB2BSelfWarehousesRequest,
  GetB2BSelfWarehousesResponse,
  GetB2BSecondaryAddressTypesResponse,
  GetB2BWarehouseAddressesRequest,
  GetB2BWarehouseAddressesResponse,
  GetB2BWaybillDetailRequest,
  GetB2BWaybillDetailResponse,
} from "./resources/b2b/types.ts";
export type {
  ContactParty,
  CreatePackagePackage,
  CreatePackageRequest,
  CreatePackageResponse,
  DeclarationItem,
  GetWaybillDetailRequest,
  GetWaybillDetailResponse,
  GetSenderRequest,
  GetSenderResponse,
  GetLastMileCarriersRequest,
  GetLastMileCarriersResponse,
  LastMileCarrierItem,
  ModifyWeightRequest,
  CancelOrderRequest,
  HoldOrderRequest,
  GetPickupPointsRequest,
  GetPickupPointsResponse,
  PickupPointItem,
  PackageDimensions,
  SizeUnit,
  WaybillDeclarationItem,
  WaybillPackage,
  WaybillParty,
  WaybillQueryStatus,
  WaybillRefParcel,
  WeightUnit,
} from "./resources/orders/types.ts";
export {
  assertValidCreatePackageRequest,
  assertValidGetWaybillDetailRequest,
  assertValidGetSenderRequest,
  assertValidGetLastMileCarriersRequest,
  assertValidModifyWeightRequest,
  assertValidCancelOrderRequest,
  assertValidHoldOrderRequest,
  assertValidGetPickupPointsRequest,
} from "./resources/orders/types.ts";

export type {
  GetLabelRequest,
  GetShippingDocsRequest,
  GetPodRequest,
  LabelResponse,
} from "./resources/labels/types.ts";

export type {
  GetTrackingInfoRequest,
  TrackEvent,
  TrackingResult,
  SubscribeTrackingByWaybillRequest,
  CancelTrackingSubscriptionByWaybillRequest,
  GetTrackingSubscriptionByWaybillRequest,
  SubscribeTrackingByProductRequest,
  CancelTrackingSubscriptionByProductRequest,
  GetTrackingSubscriptionByProductRequest,
  TrackingSubscriptionDataItem,
  TrackingSubscriptionDataResponse,
} from "./resources/tracking/types.ts";

export type {
  GetPriceTrialRequest,
  GetPriceTrialResponse,
  PriceTrialItem,
} from "./resources/pricing/types.ts";

export type {
  ChangeIssueWaybillNumberRequest,
  GetIssueOptionsRequest,
  GetIssueOptionsResponse,
  GetIssueOrderDetailRequest,
  GetIssueOrderDetailResponse,
  GetIssueReceiveAddressesResponse,
  HandleIssueRequest,
  IssueAddressInfo,
  IssueChangeNumberType,
  IssueDeclarationInfoUpdateItem,
  IssueHandleType,
  IssueHandlingPlan,
  IssueOptionItem,
  IssueReceiverInfo,
  IssueReforecastDeclarationItem,
  IssueReceiveAddressItem,
  IssueReturnType,
  IssueSolutionItem,
  IssueType,
  IssueWarehouseProcessCode,
  MarkIssueReadRequest,
  ModifyIssueDeclarationInfoRequest,
  RequestIssueWarehouseProcessRequest,
  ReforecastIssueRequest,
  ReleaseIssueRequest,
  RetryIssueDeliveryRequest,
  SelectIssueSolutionRequest,
  SelectIssueSolutionResponse,
  SubmitIssueAppealRequest,
  SubmitIssueCustomerFeedbackRequest,
  SupplyIssueReturnRequest,
} from "./resources/exceptions/types.ts";

export type {
  CancelReturnOrdersRequest,
  CreateReturnOrderRequest,
  CreateReturnOrderResponse,
  GetReturnLabelsRequest,
  GetReturnLabelsResponse,
  GetReturnOrderDetailRequest,
  GetReturnOrderDetailResponse,
  GetReturnProductsResponse,
  GetReturnSendTypesRequest,
  GetReturnSendTypesResponse,
  GetReturnTransferDetailRequest,
  GetReturnTransferDetailResponse,
  GetReturnWarehousesRequest,
  GetReturnWarehousesResponse,
  ReturnOrderSender,
  ReturnOrderReceiver,
  ReturnOrderGoodsItem,
  ReturnLabelItem,
  ReturnProductExtraService,
  ReturnProductHandle,
  ReturnProductItem,
  ReturnSendTypeItem,
  ReturnTransferBoxDetail,
  ReturnWarehouseItem,
} from "./resources/returns/types.ts";

export type {
  GetBillingDetailRequest,
  GetBillingDetailResponse,
  BillingDetailItem,
  GetFreightDetailRequest,
  GetFreightDetailResponse,
  FreightFeeDetail,
} from "./resources/billing/types.ts";

export type {
  CountryItem,
  GetCountryCodesResponse,
  GetProductsRequest,
  ProductItem,
  GetProductsResponse,
} from "./resources/basic/types.ts";

export {
  AuthenticationError,
  RateLimitError,
  RequestExecutionError,
  UpstreamApiError,
  YunExpressError,
} from "./errors/index.ts";
export type { YunExpressErrorOptions } from "./errors/index.ts";
