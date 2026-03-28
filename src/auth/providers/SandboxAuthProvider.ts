import type { SandboxAuthOptions } from "../../config/types.ts";
import {
  buildAuthHeaders,
  resolveAccessToken,
  type AccessTokenContext,
  type AuthProvider,
  type AuthRequestContext,
} from "../AuthProvider.ts";

export class SandboxAuthProvider implements AuthProvider {
  constructor(private readonly options: SandboxAuthOptions) {}

  async getHeaders(context: AuthRequestContext) {
    const tokenContext: AccessTokenContext = {
      ...context,
      sourceKey: this.options.sourceKey,
      uatAccessKey: this.options.uatAccessKey,
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
