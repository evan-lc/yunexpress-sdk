import type {
  ProductionAuthOptions,
  SandboxAuthOptions,
  YunExpressAuthOptions,
  YunExpressEnvironment,
} from "../config/types.ts";
import { ProductionAuthProvider } from "./providers/ProductionAuthProvider.ts";
import { SandboxAuthProvider } from "./providers/SandboxAuthProvider.ts";
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

const defaultSigner = new NoopRequestSigner();

export function createAuthProvider(
  environment: YunExpressEnvironment,
  auth: YunExpressAuthOptions,
): AuthProvider {
  if (auth.kind !== environment) {
    throw new TypeError(`Auth kind ${auth.kind} does not match environment ${environment}.`);
  }

  switch (auth.kind) {
    case "sandbox":
      return new SandboxAuthProvider(auth);
    case "production":
      return new ProductionAuthProvider(auth);
    default:
      throw new TypeError("Unsupported YunExpress auth configuration.");
  }
}

export async function resolveAccessToken(
  options: Pick<SandboxAuthOptions | ProductionAuthOptions, "accessToken" | "tokenProvider">,
  context: AccessTokenContext,
): Promise<string> {
  if (options.accessToken) {
    return options.accessToken;
  }

  if (options.tokenProvider) {
    return await options.tokenProvider(context);
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
  const date = new Date().toISOString();
  const sign = await (signer ?? defaultSigner).sign({
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
