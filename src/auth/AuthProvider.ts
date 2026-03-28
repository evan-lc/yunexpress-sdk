import type {
  ProductionAuthOptions,
  SandboxAuthOptions,
  YunExpressAuthOptions,
  YunExpressEnvironment,
  YunExpressLogger,
} from "../config/types.ts";
import type { FetchLike } from "../http/transport.ts";
import { ProductionAuthProvider } from "./providers/ProductionAuthProvider.ts";
import { SandboxAuthProvider } from "./providers/SandboxAuthProvider.ts";
import { HmacSha256RequestSigner } from "./signing/HmacSha256RequestSigner.ts";
import { NoopRequestSigner, type RequestSigner } from "./signing/RequestSigner.ts";

export interface AuthHeaders extends Record<string, string> {
  token: string;
  date: string;
  sign: string;
}

export interface AuthRequestContext {
  environment: YunExpressEnvironment;
  method: string;
  path: string;
  url: string;
  queryString: string;
  bodyText?: string;
  headers: Record<string, string>;
}

export interface AccessTokenContext extends AuthRequestContext {
  appId?: string;
  apiKey?: string;
  sourceKey?: string;
  uatAccessKey?: string;
}

export type AccessTokenProvider = (context: AccessTokenContext) => Promise<string> | string;

export interface AuthProvider {
  getHeaders(context: AuthRequestContext): Promise<AuthHeaders>;
}

export interface CreateAuthProviderDependencies {
  fetch?: FetchLike;
  logger?: YunExpressLogger;
}

const defaultSigner = new NoopRequestSigner();

export function createAuthProvider(
  environment: YunExpressEnvironment,
  auth: YunExpressAuthOptions,
  dependencies: CreateAuthProviderDependencies = {},
): AuthProvider {
  if (auth.kind !== environment) {
    throw new TypeError(`Auth kind ${auth.kind} does not match environment ${environment}.`);
  }

  switch (auth.kind) {
    case "sandbox":
      return new SandboxAuthProvider(auth);
    case "production":
      return new ProductionAuthProvider(auth, dependencies);
    default:
      throw new TypeError("Unsupported YunExpress auth configuration.");
  }
}

export async function resolveAccessToken(
  options: Pick<SandboxAuthOptions | ProductionAuthOptions, "accessToken" | "tokenProvider">,
  context: AccessTokenContext,
  fallbackProvider?: AccessTokenProvider,
): Promise<string> {
  if (options.accessToken) {
    return options.accessToken;
  }

  if (options.tokenProvider) {
    return await options.tokenProvider(context);
  }

  if (fallbackProvider) {
    return await fallbackProvider(context);
  }

  throw new TypeError("An access token or token provider is required.");
}

export async function buildAuthHeaders({
  context,
  token,
  signer,
  acceptLanguage,
}: {
  context: AccessTokenContext;
  token: string;
  signer?: RequestSigner;
  acceptLanguage?: string;
}): Promise<AuthHeaders> {
  const date = String(Date.now());
  const sign = await resolveSigner(context, signer).sign({
    ...context,
    token,
    date,
  });

  const headers: AuthHeaders = {
    token,
    date,
    sign,
  };

  if (acceptLanguage) {
    headers["Accept-Language"] = acceptLanguage;
  }

  return headers;
}

function resolveSigner(context: AccessTokenContext, signer?: RequestSigner): RequestSigner {
  if (signer) {
    return signer;
  }

  if (context.apiKey) {
    return new HmacSha256RequestSigner(context.apiKey);
  }

  return defaultSigner;
}
