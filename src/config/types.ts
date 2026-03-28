import type { AccessTokenProvider, AuthProvider } from "../auth/AuthProvider.ts";
import type { RequestSigner } from "../auth/signing/RequestSigner.ts";
import type { ApiEnvelopeParser } from "../http/responseParser.ts";
import type {
  FetchLike,
  RequestInterceptor,
  ResponseInterceptor,
  RetryPolicy,
  RetryPolicyInput,
} from "../http/transport.ts";

export const DEFAULT_BASE_URLS = {
  sandbox: "https://sandbox-openapi.yunexpress.com",
  production: "https://openapi.yunexpress.com",
} as const;

export type YunExpressEnvironment = keyof typeof DEFAULT_BASE_URLS;

export interface ApiEnvelope<T> {
  t?: string;
  requestId?: string;
  result: T;
  msg?: string;
  code?: number | string;
  success?: boolean;
  rawBody: unknown;
}

export interface YunExpressLogger {
  debug?(message: string, context?: unknown): void;
  info?(message: string, context?: unknown): void;
  warn?(message: string, context?: unknown): void;
  error?(message: string, context?: unknown): void;
}

interface AuthOptionsBase {
  acceptLanguage?: string;
  signer?: RequestSigner;
}

type SandboxTokenSource =
  | {
      accessToken: string;
      tokenProvider?: never;
    }
  | {
      tokenProvider: AccessTokenProvider;
      accessToken?: never;
    };

type ProductionTokenSource =
  | {
      accessToken: string;
      tokenProvider?: never;
    }
  | {
      tokenProvider: AccessTokenProvider;
      accessToken?: never;
    };

export type SandboxAuthOptions = AuthOptionsBase &
  SandboxTokenSource & {
    kind: "sandbox";
    sourceKey?: string;
    uatAccessKey?: string;
  };

export type ProductionAuthOptions = AuthOptionsBase &
  ProductionTokenSource & {
    kind: "production";
    appId: string;
    apiKey: string;
  };

export type YunExpressAuthOptions = SandboxAuthOptions | ProductionAuthOptions;

export interface YunExpressClientOptions {
  auth: YunExpressAuthOptions;
  environment?: YunExpressEnvironment;
  authProvider?: AuthProvider;
  baseUrl?: string;
  timeoutMs?: number;
  retries?: RetryPolicyInput;
  debug?: boolean;
  logger?: YunExpressLogger;
  headers?: Record<string, string>;
  fetch?: FetchLike;
  responseParser?: ApiEnvelopeParser;
  requestInterceptors?: RequestInterceptor[];
  responseInterceptors?: ResponseInterceptor[];
}

export interface ResolvedYunExpressClientOptions {
  environment: YunExpressEnvironment;
  authProvider: AuthProvider;
  baseUrl: string;
  timeoutMs: number;
  retries: RetryPolicy;
  debug: boolean;
  logger?: YunExpressLogger;
  headers: Record<string, string>;
  fetch: FetchLike;
  responseParser: ApiEnvelopeParser;
  requestInterceptors: RequestInterceptor[];
  responseInterceptors: ResponseInterceptor[];
}
