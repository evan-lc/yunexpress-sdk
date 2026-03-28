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
          description: "Subscription mode",
        },
      },
      async run({ args }) {
        try {
          const client = createClientFromArgs(args as unknown as GlobalArgs);
          const waybillNumbers = args["waybill-numbers"].split(",").map((s) => s.trim());
          const result = await client.tracking.subscribeByWaybill({
            waybillNumbers,
            subscriptionMode: args["subscription-mode"],
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
          description: "Subscription mode",
        },
      },
      async run({ args }) {
        try {
          const client = createClientFromArgs(args as unknown as GlobalArgs);
          const productCodes = args["product-codes"].split(",").map((s) => s.trim());
          const result = await client.tracking.subscribeByProduct({
            productCodes,
            subscriptionMode: args["subscription-mode"],
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
      },
      async run({ args }) {
        try {
          const client = createClientFromArgs(args as unknown as GlobalArgs);
          const productCodes = args["product-codes"].split(",").map((s) => s.trim());
          const result = await client.tracking.cancelSubscriptionByProduct({ productCodes });
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
