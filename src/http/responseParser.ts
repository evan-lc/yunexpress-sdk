import type { ApiEnvelope } from "../config/types.ts";

export interface ApiEnvelopeParser {
  parse<T>(payload: unknown, response: Response): ApiEnvelope<T>;
}

export class DefaultApiEnvelopeParser implements ApiEnvelopeParser {
  parse<T>(payload: unknown, _response: Response): ApiEnvelope<T> {
    if (isEnvelopeLike(payload)) {
      return {
        t: readString(payload, "t"),
        requestId: readString(payload, "requestId") ?? readString(payload, "request_id"),
        result: payload.result as T,
        msg: readString(payload, "msg"),
        code: readCode(payload),
        success: typeof payload.success === "boolean" ? payload.success : undefined,
        rawBody: payload,
      };
    }

    return {
      result: payload as T,
      rawBody: payload,
    };
  }
}

function isEnvelopeLike(
  payload: unknown,
): payload is Record<string, unknown> & { result: unknown } {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    return false;
  }

  return (
    "result" in payload ||
    "success" in payload ||
    "code" in payload ||
    "requestId" in payload ||
    "request_id" in payload
  );
}

function readString(payload: Record<string, unknown>, key: string): string | undefined {
  const value = payload[key];
  return typeof value === "string" ? value : undefined;
}

function readCode(payload: Record<string, unknown>): number | string | undefined {
  const value = payload.code;
  return typeof value === "number" || typeof value === "string" ? value : undefined;
}
