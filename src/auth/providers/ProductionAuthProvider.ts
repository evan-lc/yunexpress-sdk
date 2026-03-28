import type { ProductionAuthOptions } from "../../config/types.ts";
import {
  buildAuthHeaders,
  resolveAccessToken,
  type AccessTokenContext,
  type AuthProvider,
  type AuthRequestContext,
} from "../AuthProvider.ts";

export class ProductionAuthProvider implements AuthProvider {
  constructor(private readonly options: ProductionAuthOptions) {}

  async getHeaders(context: AuthRequestContext) {
    const tokenContext: AccessTokenContext = {
      ...context,
      appId: this.options.appId,
      apiKey: this.options.apiKey,
    };

    const token = await resolveAccessToken(this.options, tokenContext);

    return buildAuthHeaders({
      context: tokenContext,
      token,
      signer: this.options.signer,
      acceptLanguage: this.options.acceptLanguage,
    });
  }
}
