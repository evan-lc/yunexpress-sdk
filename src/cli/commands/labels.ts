import { defineCommand } from "citty";
import { createClientFromArgs } from "../config.ts";
import { printError, printJson } from "../output.ts";
import { globalArgs, type GlobalArgs } from "../shared.ts";

export const labelsCommand = defineCommand({
  meta: { name: "labels", description: "Label and document operations" },
  subCommands: {
    get: defineCommand({
      meta: { name: "get", description: "Get label for an order" },
      args: {
        ...globalArgs,
        "order-number": {
          type: "string",
          description: "Order number",
          required: true,
        },
      },
      async run({ args }) {
        try {
          const client = createClientFromArgs(args as unknown as GlobalArgs);
          const result = await client.labels.getLabel({
            orderNumber: args["order-number"],
          });
          printJson(result);
        } catch (error: any) {
          printError(error.message);
          process.exit(1);
        }
      },
    }),
    "shipping-docs": defineCommand({
      meta: { name: "shipping-docs", description: "Get shipping documents for an order" },
      args: {
        ...globalArgs,
        "order-number": {
          type: "string",
          description: "Order number",
          required: true,
        },
      },
      async run({ args }) {
        try {
          const client = createClientFromArgs(args as unknown as GlobalArgs);
          const result = await client.labels.getShippingDocs({
            orderNumber: args["order-number"],
          });
          printJson(result);
        } catch (error: any) {
          printError(error.message);
          process.exit(1);
        }
      },
    }),
    pod: defineCommand({
      meta: { name: "pod", description: "Get proof of delivery for an order" },
      args: {
        ...globalArgs,
        "order-number": {
          type: "string",
          description: "Order number",
          required: true,
        },
      },
      async run({ args }) {
        try {
          const client = createClientFromArgs(args as unknown as GlobalArgs);
          const result = await client.labels.getPod({
            orderNumber: args["order-number"],
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
