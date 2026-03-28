import { existsSync, readFileSync } from "node:fs";
import { homedir } from "node:os";
import { resolve } from "node:path";
import { YunExpressClient } from "../client/YunExpressClient.ts";
import type { YunExpressAuthOptions, YunExpressEnvironment } from "../config/types.ts";
import type { GlobalArgs } from "./shared.ts";

interface ConfigFile {
  appId?: string;
  apiKey?: string;
  accessToken?: string;
  environment?: string;
  sourceKey?: string;
  baseUrl?: string;
}

function loadConfigFile(configPath?: string): ConfigFile {
  const filePath = configPath ? resolve(configPath) : resolve(homedir(), ".yunexpressrc.json");

  if (!existsSync(filePath)) {
    return {};
  }

  const content = readFileSync(filePath, "utf-8");
  return JSON.parse(content) as ConfigFile;
}

function resolveValue(
  flag: string | undefined,
  envVar: string | undefined,
  configValue: string | undefined,
): string | undefined {
  return flag || envVar || configValue;
}

export function createClientFromArgs(args: GlobalArgs): YunExpressClient {
  const config = loadConfigFile(args.config);

  const environment = resolveValue(
    args.environment,
    process.env.YUNEXPRESS_ENVIRONMENT,
    config.environment,
  ) as YunExpressEnvironment | undefined;

  const appId = resolveValue(args["app-id"], process.env.YUNEXPRESS_APP_ID, config.appId);
  const apiKey = resolveValue(args["api-key"], process.env.YUNEXPRESS_API_KEY, config.apiKey);
  const accessToken = resolveValue(
    args["access-token"],
    process.env.YUNEXPRESS_ACCESS_TOKEN,
    config.accessToken,
  );
  const sourceKey = resolveValue(
    args["source-key"],
    process.env.YUNEXPRESS_SOURCE_KEY,
    config.sourceKey,
  );
  const baseUrl = resolveValue(args["base-url"], process.env.YUNEXPRESS_BASE_URL, config.baseUrl);

  const kind = environment ?? "production";

  let auth: YunExpressAuthOptions;

  if (kind === "sandbox") {
    if (!accessToken) {
      throw new Error(
        "Sandbox environment requires an access token. Provide --access-token, YUNEXPRESS_ACCESS_TOKEN env var, or set accessToken in config file.",
      );
    }
    auth = {
      kind: "sandbox",
      accessToken,
      sourceKey,
    };
  } else {
    if (!appId || !apiKey) {
      throw new Error(
        "Production environment requires appId and apiKey. Provide --app-id/--api-key flags, YUNEXPRESS_APP_ID/YUNEXPRESS_API_KEY env vars, or set them in config file.",
      );
    }
    auth = accessToken
      ? { kind: "production", appId, apiKey, accessToken, sourceKey }
      : { kind: "production", appId, apiKey, sourceKey };
  }

  return new YunExpressClient({
    auth,
    environment: kind,
    baseUrl,
    debug: args.debug,
  });
}
