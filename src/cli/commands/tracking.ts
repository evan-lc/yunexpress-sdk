import { defineCommand } from "citty";
import { createClientFromArgs } from "../config.ts";
import { printError, printJson } from "../output.ts";
import { globalArgs, type GlobalArgs } from "../shared.ts";

export const trackingCommand = defineCommand({
  meta: { name: "tracking", description: "Tracking operations" },
  subCommands: {
    get: defineCommand({
      meta: { name: "get", description: "Get tracking info for an order" },
      args: {
        ...globalArgs,
        "order-number": {
          type: "string",
          description: "Order number or waybill number",
          required: true,
        },
      },
      async run({ args }) {
        try {
          const client = createClientFromArgs(args as unknown as GlobalArgs);
          const result = await client.tracking.getTrackingInfo({
            orderNumber: args["order-number"],
          });
          printJson(result);
        } catch (error: any) {
          printError(error.message);
          process.exit(1);
        }
      },
    }),
    "subscribe-waybill": defineCommand({
      meta: { name: "subscribe-waybill", description: "Subscribe to tracking by waybill numbers" },
      args: {
        ...globalArgs,
        "waybill-numbers": {
          type: "string",
          description: "Comma-separated waybill numbers (max 20)",
          required: true,
        },
        "subscription-mode": {
          type: "string",
          description: "Deprecated alias for subscribe type",
        },
        "subscribe-type": {
          type: "string",
          description: "Subscribe type: A, F, L, N, EL, ANC",
          required: true,
        },
        "query-types": {
          type: "string",
          description: "Comma-separated query types: C, Y, T",
        },
      },
      async run({ args }) {
        try {
          const client = createClientFromArgs(args as unknown as GlobalArgs);
          const waybillNumbers = args["waybill-numbers"].split(",").map((s) => s.trim());
          const result = await client.tracking.subscribeByWaybill({
            waybillNumbers,
            subscribeType: (args["subscribe-type"] ?? args["subscription-mode"]) as any,
            queryTypes: parseQueryTypes(args["query-types"]),
          });
          printJson(result);
        } catch (error: any) {
          printError(error.message);
          process.exit(1);
        }
      },
    }),
    "cancel-waybill": defineCommand({
      meta: {
        name: "cancel-waybill",
        description: "Cancel tracking subscription by waybill numbers",
      },
      args: {
        ...globalArgs,
        "waybill-numbers": {
          type: "string",
          description: "Comma-separated waybill numbers",
          required: true,
        },
      },
      async run({ args }) {
        try {
          const client = createClientFromArgs(args as unknown as GlobalArgs);
          const waybillNumbers = args["waybill-numbers"].split(",").map((s) => s.trim());
          const result = await client.tracking.cancelSubscriptionByWaybill({ waybillNumbers });
          printJson(result);
        } catch (error: any) {
          printError(error.message);
          process.exit(1);
        }
      },
    }),
    "get-waybill-sub": defineCommand({
      meta: {
        name: "get-waybill-sub",
        description: "Get tracking subscription by waybill numbers",
      },
      args: {
        ...globalArgs,
        "waybill-numbers": {
          type: "string",
          description: "Comma-separated waybill numbers",
          required: true,
        },
      },
      async run({ args }) {
        try {
          const client = createClientFromArgs(args as unknown as GlobalArgs);
          const waybillNumbers = args["waybill-numbers"].split(",").map((s) => s.trim());
          const result = await client.tracking.getSubscriptionByWaybill({ waybillNumbers });
          printJson(result);
        } catch (error: any) {
          printError(error.message);
          process.exit(1);
        }
      },
    }),
    "subscribe-product": defineCommand({
      meta: { name: "subscribe-product", description: "Subscribe to tracking by product codes" },
      args: {
        ...globalArgs,
        "product-codes": {
          type: "string",
          description: "Comma-separated product codes (max 20)",
          required: true,
        },
        "subscription-mode": {
          type: "string",
          description: "Deprecated alias for subscribe type",
        },
        "subscribe-type": {
          type: "string",
          description: "Subscribe type: A, F, L, N, EL, ANC",
          required: true,
        },
        "query-types": {
          type: "string",
          description: "Comma-separated query types: C, Y, T",
        },
        "country-codes": {
          type: "string",
          description: "Optional comma-separated country codes applied to each product code",
        },
      },
      async run({ args }) {
        try {
          const client = createClientFromArgs(args as unknown as GlobalArgs);
          const productCodes = args["product-codes"].split(",").map((s) => s.trim());
          const countryCodes = parseCountryCodes(args["country-codes"]);
          const result = await client.tracking.subscribeByProduct({
            productCodes,
            subscribeProducts: countryCodes
              ? productCodes.map((productCode) => ({
                  productCode,
                  countryCodes,
                }))
              : undefined,
            subscribeType: (args["subscribe-type"] ?? args["subscription-mode"]) as any,
            queryTypes: parseQueryTypes(args["query-types"]),
          });
          printJson(result);
        } catch (error: any) {
          printError(error.message);
          process.exit(1);
        }
      },
    }),
    "cancel-product": defineCommand({
      meta: {
        name: "cancel-product",
        description: "Cancel tracking subscription by product codes",
      },
      args: {
        ...globalArgs,
        "product-codes": {
          type: "string",
          description: "Comma-separated product codes",
          required: true,
        },
        "country-codes": {
          type: "string",
          description: "Optional comma-separated country codes applied to each product code",
        },
      },
      async run({ args }) {
        try {
          const client = createClientFromArgs(args as unknown as GlobalArgs);
          const productCodes = args["product-codes"].split(",").map((s) => s.trim());
          const countryCodes = parseCountryCodes(args["country-codes"]);
          const result = await client.tracking.cancelSubscriptionByProduct({
            productCodes,
            subscribeProducts: countryCodes
              ? productCodes.map((productCode) => ({
                  productCode,
                  countryCodes,
                }))
              : undefined,
          });
          printJson(result);
        } catch (error: any) {
          printError(error.message);
          process.exit(1);
        }
      },
    }),
    "get-product-sub": defineCommand({
      meta: { name: "get-product-sub", description: "Get tracking subscription by product code" },
      args: {
        ...globalArgs,
        "product-code": {
          type: "string",
          description: "Product code",
          required: true,
        },
      },
      async run({ args }) {
        try {
          const client = createClientFromArgs(args as unknown as GlobalArgs);
          const result = await client.tracking.getSubscriptionByProduct({
            productCode: args["product-code"],
          });
          printJson(result);
        } catch (error: any) {
          printError(error.message);
          process.exit(1);
        }
      },
    }),
  },
});

function parseCountryCodes(countryCodes: string | undefined): string[] | undefined {
  return countryCodes ? countryCodes.split(",").map((value) => value.trim()) : undefined;
}

function parseQueryTypes(queryTypes: string | undefined): Array<"C" | "Y" | "T"> | undefined {
  return queryTypes
    ? (queryTypes.split(",").map((value) => value.trim()) as Array<"C" | "Y" | "T">)
    : undefined;
}
