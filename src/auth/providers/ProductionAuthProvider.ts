import type { ProductionAuthOptions } from "../../config/types.ts";
import {
  buildAuthHeaders,
  resolveAccessToken,
  type AccessTokenContext,
  type AccessTokenProvider,
  type AuthProvider,
  type AuthRequestContext,
  type CreateAuthProviderDependencies,
} from "../AuthProvider.ts";
import { createOAuthAccessTokenProvider } from "../token/createOAuthAccessTokenProvider.ts";

export class ProductionAuthProvider implements AuthProvider {
  private readonly autoTokenProvider?: AccessTokenProvider;

  constructor(
    private readonly options: ProductionAuthOptions,
    dependencies: CreateAuthProviderDependencies = {},
  ) {
    if (!options.accessToken && !options.tokenProvider) {
      this.autoTokenProvider = createOAuthAccessTokenProvider({
        environment: "production",
        appId: options.appId,
        appSecret: options.apiKey,
        sourceKey: options.sourceKey,
        tokenEndpoint: options.tokenEndpoint,
        tokenHeaders: options.tokenHeaders,
        refreshBufferMs: options.tokenRefreshBufferMs,
        fetch: dependencies.fetch,
        logger: dependencies.logger,
      });
    }
  }

  async getHeaders(context: AuthRequestContext) {
    const tokenContext: AccessTokenContext = {
      ...context,
      appId: this.options.appId,
      apiKey: this.options.apiKey,
    };

    const token = await resolveAccessToken(this.options, tokenContext, this.autoTokenProvider);

    return buildAuthHeaders({
      context: tokenContext,
      token,
      signer: this.options.signer,
      acceptLanguage: this.options.acceptLanguage,
    });
  }
}
