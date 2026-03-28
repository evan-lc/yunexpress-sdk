import type { ArgsDef } from "citty";

export const globalArgs = {
  config: {
    type: "string",
    description: "Path to config file (default: ~/.yunexpressrc.json)",
  },
  environment: {
    type: "string",
    description: 'Environment: "sandbox" or "production"',
  },
  "app-id": {
    type: "string",
    description: "Production app ID",
  },
  "api-key": {
    type: "string",
    description: "Production API key",
  },
  "access-token": {
    type: "string",
    description: "Access token (sandbox or production)",
  },
  "source-key": {
    type: "string",
    description: "Source key",
  },
  "base-url": {
    type: "string",
    description: "Custom base URL",
  },
  debug: {
    type: "boolean",
    description: "Enable debug output",
    default: false,
  },
} as const satisfies ArgsDef;

export type GlobalArgs = {
  config?: string;
  environment?: string;
  "app-id"?: string;
  "api-key"?: string;
  "access-token"?: string;
  "source-key"?: string;
  "base-url"?: string;
  debug: boolean;
};
