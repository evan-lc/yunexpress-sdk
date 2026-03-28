import { afterEach, beforeEach, describe, expect, it } from "vite-plus/test";
import { createClientFromArgs } from "../../src/cli/config.ts";
import type { GlobalArgs } from "../../src/cli/shared.ts";

function baseArgs(overrides: Partial<GlobalArgs> = {}): GlobalArgs {
  return {
    debug: false,
    ...overrides,
  };
}

describe("createClientFromArgs", () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    process.env = { ...originalEnv };
    delete process.env.YUNEXPRESS_APP_ID;
    delete process.env.YUNEXPRESS_API_KEY;
    delete process.env.YUNEXPRESS_ACCESS_TOKEN;
    delete process.env.YUNEXPRESS_ENVIRONMENT;
    delete process.env.YUNEXPRESS_SOURCE_KEY;
    delete process.env.YUNEXPRESS_BASE_URL;
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it("creates a production client from CLI flags", () => {
    const client = createClientFromArgs(
      baseArgs({
        "app-id": "test-app",
        "api-key": "test-key",
        environment: "production",
      }),
    );
    expect(client).toBeDefined();
    expect(client.environment).toBe("production");
  });

  it("creates a sandbox client from CLI flags", () => {
    const client = createClientFromArgs(
      baseArgs({
        "access-token": "sandbox-token",
        environment: "sandbox",
      }),
    );
    expect(client).toBeDefined();
    expect(client.environment).toBe("sandbox");
  });

  it("creates a production client from env vars", () => {
    process.env.YUNEXPRESS_APP_ID = "env-app";
    process.env.YUNEXPRESS_API_KEY = "env-key";
    process.env.YUNEXPRESS_ENVIRONMENT = "production";

    const client = createClientFromArgs(baseArgs());
    expect(client).toBeDefined();
    expect(client.environment).toBe("production");
  });

  it("creates a sandbox client from env vars", () => {
    process.env.YUNEXPRESS_ACCESS_TOKEN = "env-token";
    process.env.YUNEXPRESS_ENVIRONMENT = "sandbox";

    const client = createClientFromArgs(baseArgs());
    expect(client).toBeDefined();
    expect(client.environment).toBe("sandbox");
  });

  it("CLI flags take precedence over env vars", () => {
    process.env.YUNEXPRESS_APP_ID = "env-app";
    process.env.YUNEXPRESS_API_KEY = "env-key";
    process.env.YUNEXPRESS_ENVIRONMENT = "production";

    const client = createClientFromArgs(
      baseArgs({
        "app-id": "flag-app",
        "api-key": "flag-key",
      }),
    );
    expect(client).toBeDefined();
    expect(client.environment).toBe("production");
  });

  it("uses custom base URL when provided", () => {
    const client = createClientFromArgs(
      baseArgs({
        "app-id": "test-app",
        "api-key": "test-key",
        environment: "production",
        "base-url": "https://custom.example.com",
      }),
    );
    expect(client.baseUrl).toBe("https://custom.example.com");
  });

  it("throws when sandbox is missing access token", () => {
    expect(() => createClientFromArgs(baseArgs({ environment: "sandbox" }))).toThrow(
      /access token/i,
    );
  });

  it("throws when production is missing app-id or api-key", () => {
    expect(() => createClientFromArgs(baseArgs({ environment: "production" }))).toThrow(
      /appId and apiKey/i,
    );
  });

  it("throws when only app-id is provided without api-key", () => {
    expect(() =>
      createClientFromArgs(baseArgs({ "app-id": "test-app", environment: "production" })),
    ).toThrow(/appId and apiKey/i);
  });
});
