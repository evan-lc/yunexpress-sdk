import { createHmac } from "node:crypto";
import type { RequestSigner, SignerContext } from "./RequestSigner.ts";

export class HmacSha256RequestSigner implements RequestSigner {
  constructor(private readonly secret: string) {}

  sign(context: SignerContext): string {
    const parts = [
      context.bodyText ? `body=${context.bodyText}` : undefined,
      `date=${context.date}`,
      `method=${context.method}`,
      `uri=${context.path}`,
    ].filter((value): value is string => typeof value === "string");

    return createHmac("sha256", this.secret).update(parts.join("&")).digest("base64");
  }
}
