import { defineCommand } from "citty";
import { createClientFromArgs } from "../config.ts";
import { printError, printJson, readDataInput } from "../output.ts";
import { globalArgs, type GlobalArgs } from "../shared.ts";

export const returnsCommand = defineCommand({
  meta: { name: "returns", description: "Return order operations" },
  subCommands: {
    get: defineCommand({
      meta: { name: "get", description: "Get a return order detail" },
      args: {
        ...globalArgs,
        "order-code": {
          type: "string",
          description: "Return order code",
          required: true,
        },
      },
      async run({ args }) {
        try {
          const client = createClientFromArgs(args as unknown as GlobalArgs);
          const result = await client.returns.getOrderDetail({
            orderCode: args["order-code"],
          });
          printJson(result);
        } catch (error: any) {
          printError(error.message);
          process.exit(1);
        }
      },
    }),
    "transfer-detail": defineCommand({
      meta: { name: "transfer-detail", description: "Get a return transfer detail" },
      args: {
        ...globalArgs,
        "transfer-code": {
          type: "string",
          description: "Transfer code",
          required: true,
        },
      },
      async run({ args }) {
        try {
          const client = createClientFromArgs(args as unknown as GlobalArgs);
          const result = await client.returns.getTransferDetail({
            transferCode: args["transfer-code"],
          });
          printJson(result);
        } catch (error: any) {
          printError(error.message);
          process.exit(1);
        }
      },
    }),
    create: defineCommand({
      meta: { name: "create", description: "Create a return order" },
      args: {
        ...globalArgs,
        data: {
          type: "string",
          description: "JSON payload or @file path (e.g. --data @return.json)",
          required: true,
        },
      },
      async run({ args }) {
        try {
          const client = createClientFromArgs(args as unknown as GlobalArgs);
          const input = await readDataInput(args.data);
          const result = await client.returns.createReturnOrder(input as any);
          printJson(result);
        } catch (error: any) {
          printError(error.message);
          process.exit(1);
        }
      },
    }),
    cancel: defineCommand({
      meta: { name: "cancel", description: "Cancel return orders" },
      args: {
        ...globalArgs,
        "order-codes": {
          type: "string",
          description: "Comma-separated return order codes",
          required: true,
        },
      },
      async run({ args }) {
        try {
          const client = createClientFromArgs(args as unknown as GlobalArgs);
          const result = await client.returns.cancelOrders({
            orderCodes: args["order-codes"].split(",").map((value) => value.trim()),
          });
          printJson(result);
        } catch (error: any) {
          printError(error.message);
          process.exit(1);
        }
      },
    }),
    labels: defineCommand({
      meta: { name: "labels", description: "Download return labels" },
      args: {
        ...globalArgs,
        "order-codes": {
          type: "string",
          description: "Comma-separated return order codes",
          required: true,
        },
      },
      async run({ args }) {
        try {
          const client = createClientFromArgs(args as unknown as GlobalArgs);
          const result = await client.returns.getLabels({
            orderCodes: args["order-codes"].split(",").map((value) => value.trim()),
          });
          printJson(result);
        } catch (error: any) {
          printError(error.message);
          process.exit(1);
        }
      },
    }),
    products: defineCommand({
      meta: { name: "products", description: "List return products" },
      args: {
        ...globalArgs,
      },
      async run({ args }) {
        try {
          const client = createClientFromArgs(args as unknown as GlobalArgs);
          const result = await client.returns.getProducts();
          printJson(result);
        } catch (error: any) {
          printError(error.message);
          process.exit(1);
        }
      },
    }),
    warehouses: defineCommand({
      meta: { name: "warehouses", description: "List return warehouses for a product" },
      args: {
        ...globalArgs,
        "product-code": {
          type: "string",
          description: "Product code",
          required: true,
        },
        "country-code": {
          type: "string",
          description: "Optional 2-letter country code",
        },
      },
      async run({ args }) {
        try {
          const client = createClientFromArgs(args as unknown as GlobalArgs);
          const result = await client.returns.getWarehouses({
            productCode: args["product-code"],
            countryCode: args["country-code"],
          });
          printJson(result);
        } catch (error: any) {
          printError(error.message);
          process.exit(1);
        }
      },
    }),
    "send-types": defineCommand({
      meta: { name: "send-types", description: "List return send types for a product" },
      args: {
        ...globalArgs,
        "product-code": {
          type: "string",
          description: "Product code",
          required: true,
        },
        "sender-country": {
          type: "string",
          description: "Sender country code",
          required: true,
        },
        "warehouse-country": {
          type: "string",
          description: "Warehouse country code",
          required: true,
        },
      },
      async run({ args }) {
        try {
          const client = createClientFromArgs(args as unknown as GlobalArgs);
          const result = await client.returns.getSendTypes({
            productCode: args["product-code"],
            senderCountry: args["sender-country"],
            warehouseCountry: args["warehouse-country"],
          });
          printJson(result);
        } catch (error: any) {
          printError(error.message);
          process.exit(1);
        }
      },
    }),
    operation: defineCommand({
      meta: { name: "operation", description: "Process return orders after warehouse arrival" },
      args: {
        ...globalArgs,
        "order-codes": {
          type: "string",
          description: "Comma-separated return order codes",
          required: true,
        },
        "operation-type": {
          type: "string",
          description: "Operation type: 1=discard, 2=destroy, 3=extend-storage",
          required: true,
        },
      },
      async run({ args }) {
        try {
          const client = createClientFromArgs(args as unknown as GlobalArgs);
          const result = await client.returns.processArrival({
            orderCodes: args["order-codes"].split(",").map((value) => value.trim()),
            operationType: Number(args["operation-type"]) as 1 | 2 | 3,
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
