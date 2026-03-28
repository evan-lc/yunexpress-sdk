import {
  DEFAULT_BASE_URLS,
  type YunExpressEnvironment,
  type YunExpressLogger,
} from "../../config/types.ts";
import type { FetchLike } from "../../http/transport.ts";
import { AuthenticationError } from "../../errors/AuthenticationError.ts";
import { RequestExecutionError } from "../../errors/RequestExecutionError.ts";
import type { AccessTokenProvider } from "../AuthProvider.ts";

const DEFAULT_EXPIRES_IN_MS = 7_200_000;
const DEFAULT_TOKEN_REFRESH_BUFFER_MS = 60_000;

export interface OAuthTokenProviderOptions {
  environment: YunExpressEnvironment;
  appId: string;
  appSecret: string;
  sourceKey?: string;
  tokenEndpoint?: string;
  tokenHeaders?: Record<string, string>;
  refreshBufferMs?: number;
  fetch?: FetchLike;
  logger?: YunExpressLogger;
}

export function createOAuthAccessTokenProvider(
  options: OAuthTokenProviderOptions,
): AccessTokenProvider {
  const fetchImplementation = options.fetch ?? globalThis.fetch?.bind(globalThis);
  if (!fetchImplementation) {
    throw new TypeError(
      "Global fetch is unavailable. Use Node 18+ or pass a custom fetch implementation.",
    );
  }

  const refreshBufferMs = options.refreshBufferMs ?? DEFAULT_TOKEN_REFRESH_BUFFER_MS;
  const tokenEndpoint =
    options.tokenEndpoint ?? `${DEFAULT_BASE_URLS[options.environment]}/openapi/oauth2/token`;

  let cachedToken:
    | {
        value: string;
        expiresAt: number;
      }
    | undefined;
  let inFlightExchange: Promise<string> | undefined;

  return async () => {
    const now = Date.now();

    if (cachedToken && now < cachedToken.expiresAt - refreshBufferMs) {
      return cachedToken.value;
    }

    if (!inFlightExchange) {
      inFlightExchange = exchangeAccessToken({
        fetchImplementation,
        tokenEndpoint,
        options,
      }).then(({ accessToken, expiresInMs }) => {
        cachedToken = {
          value: accessToken,
          expiresAt: Date.now() + expiresInMs,
        };
        return accessToken;
      });
    }

    try {
      return await inFlightExchange;
    } finally {
      inFlightExchange = undefined;
    }
  };
}

async function exchangeAccessToken({
  fetchImplementation,
  tokenEndpoint,
  options,
}: {
  fetchImplementation: FetchLike;
  tokenEndpoint: string;
  options: OAuthTokenProviderOptions;
}): Promise<{ accessToken: string; expiresInMs: number }> {
  options.logger?.debug?.("Exchanging YunExpress access token", {
    environment: options.environment,
    tokenEndpoint,
  });

  let response: Response;

  try {
    response = await fetchImplementation(tokenEndpoint, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        ...options.tokenHeaders,
      },
      body: JSON.stringify(buildTokenRequestBody(options)),
    });
  } catch (error) {
    throw new RequestExecutionError("Failed to exchange YunExpress access token.", {
      code: "TOKEN_EXCHANGE_FAILED",
      cause: error,
    });
  }

  const responseHeaders = headersToRecord(response.headers);
  const payload = await parseResponseBody(response);
  if (!response.ok) {
    throw new AuthenticationError(resolveErrorMessage(payload), {
      code: readCode(payload),
      status: response.status,
      headers: responseHeaders,
      body: payload,
    });
  }

  if (!isObject(payload) || typeof payload.accessToken !== "string") {
    throw new AuthenticationError("YunExpress token response did not include accessToken.", {
      status: response.status,
      headers: responseHeaders,
      body: payload,
    });
  }

  const expiresInMs = normalizeExpiresInMs(payload.expiresIn);

  options.logger?.debug?.("Received YunExpress access token", {
    environment: options.environment,
    expiresInMs,
  });

  return {
    accessToken: payload.accessToken,
    expiresInMs,
  };
}

function buildTokenRequestBody(options: OAuthTokenProviderOptions): Record<string, string> {
  return {
    grantType: "client_credentials",
    appId: options.appId,
    appSecret: options.appSecret,
    ...(options.sourceKey ? { sourceKey: options.sourceKey } : {}),
  };
}

async function parseResponseBody(response: Response): Promise<unknown> {
  const text = await response.text();
  if (!text) {
    return undefined;
  }

  try {
    return JSON.parse(text) as unknown;
  } catch {
    return text;
  }
}

function headersToRecord(headers: Headers): Record<string, string> {
  const record: Record<string, string> = {};

  headers.forEach((value, key) => {
    record[key] = value;
  });

  return record;
}

function normalizeExpiresInMs(expiresIn: unknown): number {
  const normalized =
    typeof expiresIn === "number"
      ? expiresIn
      : typeof expiresIn === "string"
        ? Number(expiresIn)
        : NaN;

  return Number.isFinite(normalized) && normalized > 0 ? normalized * 1000 : DEFAULT_EXPIRES_IN_MS;
}

function resolveErrorMessage(payload: unknown): string {
  if (isObject(payload) && typeof payload.message === "string") {
    return payload.message;
  }

  if (isObject(payload) && typeof payload.msg === "string") {
    return payload.msg;
  }

  return "Failed to exchange YunExpress access token.";
}

function readCode(payload: unknown): number | string | undefined {
  if (!isObject(payload)) {
    return undefined;
  }

  const value = payload.code;
  return typeof value === "number" || typeof value === "string" ? value : undefined;
}

function isObject(payload: unknown): payload is Record<string, unknown> {
  return Boolean(payload) && typeof payload === "object" && !Array.isArray(payload);
}
