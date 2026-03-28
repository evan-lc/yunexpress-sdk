import { defineCommand } from "citty";
import { createClientFromArgs } from "../config.ts";
import { printError, printJson, readDataInput } from "../output.ts";
import { globalArgs, type GlobalArgs } from "../shared.ts";

export const ordersCommand = defineCommand({
  meta: { name: "orders", description: "Manage orders" },
  subCommands: {
    create: defineCommand({
      meta: { name: "create", description: "Create a package order" },
      args: {
        ...globalArgs,
        data: {
          type: "string",
          description:
            'JSON payload or @file path (e.g. --data \'{"productCode":"..."}\' or --data @payload.json)',
          required: true,
        },
      },
      async run({ args }) {
        try {
          const client = createClientFromArgs(args as unknown as GlobalArgs);
          const input = await readDataInput(args.data);
          const result = await client.orders.createPackage(input as any);
          printJson(result);
        } catch (error: any) {
          printError(error.message);
          process.exit(1);
        }
      },
    }),
    get: defineCommand({
      meta: { name: "get", description: "Get waybill detail" },
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
          const result = await client.orders.getWaybillDetail({
            orderNumber: args["order-number"],
          });
          printJson(result);
        } catch (error: any) {
          printError(error.message);
          process.exit(1);
        }
      },
    }),
    "get-sender": defineCommand({
      meta: { name: "get-sender", description: "Get sender info for an order" },
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
          const result = await client.orders.getSender({
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
      meta: { name: "last-mile-carriers", description: "Get last mile carriers for waybills" },
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
          const result = await client.orders.getLastMileCarriers({ waybillNumbers });
          printJson(result);
        } catch (error: any) {
          printError(error.message);
          process.exit(1);
        }
      },
    }),
    "modify-weight": defineCommand({
      meta: { name: "modify-weight", description: "Modify the weight of a waybill" },
      args: {
        ...globalArgs,
        "waybill-number": {
          type: "string",
          description: "Waybill number",
          required: true,
        },
        weight: {
          type: "string",
          description: "New weight value",
          required: true,
        },
        "weight-unit": {
          type: "string",
          description: 'Weight unit: "G", "KG", or "LBS"',
        },
      },
      async run({ args }) {
        try {
          const client = createClientFromArgs(args as unknown as GlobalArgs);
          const result = await client.orders.modifyWeight({
            waybillNumber: args["waybill-number"],
            weight: Number(args.weight),
            weightUnit: args["weight-unit"] as any,
          });
          printJson(result);
        } catch (error: any) {
          printError(error.message);
          process.exit(1);
        }
      },
    }),
    cancel: defineCommand({
      meta: { name: "cancel", description: "Cancel an order" },
      args: {
        ...globalArgs,
        "waybill-number": {
          type: "string",
          description: "Waybill number to cancel",
          required: true,
        },
      },
      async run({ args }) {
        try {
          const client = createClientFromArgs(args as unknown as GlobalArgs);
          const result = await client.orders.cancelOrder({
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
      meta: { name: "hold", description: "Hold an order" },
      args: {
        ...globalArgs,
        "waybill-number": {
          type: "string",
          description: "Waybill number to hold",
          required: true,
        },
        remark: {
          type: "string",
          description: "Optional remark",
        },
      },
      async run({ args }) {
        try {
          const client = createClientFromArgs(args as unknown as GlobalArgs);
          const result = await client.orders.holdOrder({
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
    "pickup-points": defineCommand({
      meta: { name: "pickup-points", description: "Get pickup points" },
      args: {
        ...globalArgs,
        "country-code": {
          type: "string",
          description: "2-letter ISO country code",
          required: true,
        },
        "postal-code": {
          type: "string",
          description: "Postal code filter",
        },
        city: {
          type: "string",
          description: "City filter",
        },
        "carrier-code": {
          type: "string",
          description: "Carrier code filter",
        },
      },
      async run({ args }) {
        try {
          const client = createClientFromArgs(args as unknown as GlobalArgs);
          const result = await client.orders.getPickupPoints({
            countryCode: args["country-code"],
            postalCode: args["postal-code"],
            city: args.city,
            carrierCode: args["carrier-code"],
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
