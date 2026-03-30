import { defineCommand } from "citty";
import { createClientFromArgs } from "../config.ts";
import { printError, printJson } from "../output.ts";
import { globalArgs, type GlobalArgs } from "../shared.ts";

export const b2bCommand = defineCommand({
  meta: { name: "b2b", description: "B2B order operations" },
  subCommands: {
    get: defineCommand({
      meta: { name: "get", description: "Get B2B order detail" },
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
          const result = await client.b2b.getWaybillDetail({
            orderNumber: args["order-number"],
          });
          printJson(result);
        } catch (error: any) {
          printError(error.message);
          process.exit(1);
        }
      },
    }),
    label: defineCommand({
      meta: { name: "label", description: "Get B2B label" },
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
          const result = await client.b2b.getLabel({
            orderNumber: args["order-number"],
          });
          printJson(result);
        } catch (error: any) {
          printError(error.message);
          process.exit(1);
        }
      },
    }),
    "last-mile-carriers": defineCommand({
      meta: { name: "last-mile-carriers", description: "Get B2B last mile carriers" },
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
          const result = await client.b2b.getLastMileCarriers({
            waybillNumbers: args["waybill-numbers"].split(",").map((value) => value.trim()),
          });
          printJson(result);
        } catch (error: any) {
          printError(error.message);
          process.exit(1);
        }
      },
    }),
    products: defineCommand({
      meta: { name: "products", description: "List B2B products" },
      args: {
        ...globalArgs,
        "country-code": {
          type: "string",
          description: "Optional 2-letter country code",
        },
      },
      async run({ args }) {
        try {
          const client = createClientFromArgs(args as unknown as GlobalArgs);
          const result = await client.b2b.getProducts({
            countryCode: args["country-code"],
          });
          printJson(result);
        } catch (error: any) {
          printError(error.message);
          process.exit(1);
        }
      },
    }),
    "address-types": defineCommand({
      meta: { name: "address-types", description: "List B2B secondary address types" },
      args: {
        ...globalArgs,
      },
      async run({ args }) {
        try {
          const client = createClientFromArgs(args as unknown as GlobalArgs);
          const result = await client.b2b.getSecondaryAddressTypes();
          printJson(result);
        } catch (error: any) {
          printError(error.message);
          process.exit(1);
        }
      },
    }),
    addresses: defineCommand({
      meta: { name: "addresses", description: "List B2B warehouse addresses" },
      args: {
        ...globalArgs,
        "address-type": {
          type: "string",
          description: "Optional address type: 0, 1, 2, or 3",
        },
        "secondary-address-type": {
          type: "string",
          description: "Optional secondary address type",
        },
        "country-code": {
          type: "string",
          description: "Optional 2-letter country code",
        },
      },
      async run({ args }) {
        try {
          const client = createClientFromArgs(args as unknown as GlobalArgs);
          const result = await client.b2b.getWarehouseAddresses({
            addressType:
              args["address-type"] !== undefined
                ? (Number(args["address-type"]) as 0 | 1 | 2 | 3)
                : undefined,
            secondaryAddressType: args["secondary-address-type"],
            countryCode: args["country-code"],
          });
          printJson(result);
        } catch (error: any) {
          printError(error.message);
          process.exit(1);
        }
      },
    }),
    "self-warehouses": defineCommand({
      meta: { name: "self-warehouses", description: "List B2B self warehouses for a product" },
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
          const result = await client.b2b.getSelfWarehouses({
            productCode: args["product-code"],
          });
          printJson(result);
        } catch (error: any) {
          printError(error.message);
          process.exit(1);
        }
      },
    }),
    "collect-warehouses": defineCommand({
      meta: { name: "collect-warehouses", description: "List B2B collect warehouses" },
      args: {
        ...globalArgs,
      },
      async run({ args }) {
        try {
          const client = createClientFromArgs(args as unknown as GlobalArgs);
          const result = await client.b2b.getCollectWarehouses();
          printJson(result);
        } catch (error: any) {
          printError(error.message);
          process.exit(1);
        }
      },
    }),
    cancel: defineCommand({
      meta: { name: "cancel", description: "Cancel a B2B order" },
      args: {
        ...globalArgs,
        "waybill-number": {
          type: "string",
          description: "Waybill number",
          required: true,
        },
      },
      async run({ args }) {
        try {
          const client = createClientFromArgs(args as unknown as GlobalArgs);
          const result = await client.b2b.cancelOrder({
            waybillNumber: args["waybill-number"],
          });
          printJson(result);
        } catch (error: any) {
          printError(error.message);
          process.exit(1);
        }
      },
    }),
    hold: defineCommand({
      meta: { name: "hold", description: "Hold a B2B order" },
      args: {
        ...globalArgs,
        "waybill-number": {
          type: "string",
          description: "Waybill number",
          required: true,
        },
        remark: {
          type: "string",
          description: "Hold remark",
          required: true,
        },
      },
      async run({ args }) {
        try {
          const client = createClientFromArgs(args as unknown as GlobalArgs);
          const result = await client.b2b.holdOrder({
            waybillNumber: args["waybill-number"],
            remark: args.remark,
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
