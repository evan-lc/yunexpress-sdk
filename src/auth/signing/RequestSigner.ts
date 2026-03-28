import type { AccessTokenContext } from "../AuthProvider.ts";

export interface SignerContext extends AccessTokenContext {
  token: string;
  date: string;
}

export interface RequestSigner {
  sign(context: SignerContext): Promise<string> | string;
}

export class NoopRequestSigner implements RequestSigner {
  sign(): string {
    return "";
  }
}
