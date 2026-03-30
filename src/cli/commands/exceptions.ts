import { defineCommand } from "citty";
import { createClientFromArgs } from "../config.ts";
import { printError, printJson, readDataInput } from "../output.ts";
import { globalArgs, type GlobalArgs } from "../shared.ts";

export const exceptionsCommand = defineCommand({
  meta: { name: "exceptions", description: "Exception handling operations" },
  subCommands: {
    get: defineCommand({
      meta: { name: "get", description: "Get exception order detail" },
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
          const result = await client.exceptions.getOrderDetail({
            waybillNumber: args["waybill-number"],
          });
          printJson(result);
        } catch (error: any) {
          printError(error.message);
          process.exit(1);
        }
      },
    }),
    options: defineCommand({
      meta: { name: "options", description: "List available exception options" },
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
          const result = await client.exceptions.getOptions({
            waybillNumber: args["waybill-number"],
          });
          printJson(result);
        } catch (error: any) {
          printError(error.message);
          process.exit(1);
        }
      },
    }),
    read: defineCommand({
      meta: { name: "read", description: "Mark an exception order as read" },
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
          const result = await client.exceptions.markAsRead({
            waybillNumber: args["waybill-number"],
          });
          printJson(result);
        } catch (error: any) {
          printError(error.message);
          process.exit(1);
        }
      },
    }),
    "receive-addresses": defineCommand({
      meta: { name: "receive-addresses", description: "List exception receive addresses" },
      args: {
        ...globalArgs,
      },
      async run({ args }) {
        try {
          const client = createClientFromArgs(args as unknown as GlobalArgs);
          const result = await client.exceptions.getReceiveAddresses();
          printJson(result);
        } catch (error: any) {
          printError(error.message);
          process.exit(1);
        }
      },
    }),
    release: defineCommand({
      meta: { name: "release", description: "Release an issue for a waybill" },
      args: {
        ...globalArgs,
        "waybill-number": {
          type: "string",
          description: "Waybill number",
          required: true,
        },
        remark: {
          type: "string",
          description: "Optional remark (max 255 chars)",
        },
        "new-waybill-numbers": {
          type: "string",
          description: "Comma-separated new waybill numbers (max 100)",
        },
        "extra-codes": {
          type: "string",
          description: 'Comma-separated extra codes: "203", "204", "205", "206"',
        },
      },
      async run({ args }) {
        try {
          const client = createClientFromArgs(args as unknown as GlobalArgs);
          const result = await client.exceptions.releaseIssue({
            waybillNumber: args["waybill-number"],
            remark: args.remark,
            newWaybillNumbers: args["new-waybill-numbers"]
              ? args["new-waybill-numbers"].split(",").map((s) => s.trim())
              : undefined,
            extraCodes: args["extra-codes"]
              ? (args["extra-codes"].split(",").map((s) => s.trim()) as any)
              : undefined,
          });
          printJson(result);
        } catch (error: any) {
          printError(error.message);
          process.exit(1);
        }
      },
    }),
    handle: defineCommand({
      meta: { name: "handle", description: "Send a common exception handling instruction" },
      args: {
        ...globalArgs,
        data: {
          type: "string",
          description: "JSON payload or @file path (e.g. --data @handle.json)",
          required: true,
        },
      },
      async run({ args }) {
        try {
          const client = createClientFromArgs(args as unknown as GlobalArgs);
          const input = await readDataInput(args.data);
          const result = await client.exceptions.handle(input as any);
          printJson(result);
        } catch (error: any) {
          printError(error.message);
          process.exit(1);
        }
      },
    }),
    appeal: defineCommand({
      meta: { name: "appeal", description: "Submit exception appeal files or materials" },
      args: {
        ...globalArgs,
        data: {
          type: "string",
          description: "JSON payload or @file path (e.g. --data @appeal.json)",
          required: true,
        },
      },
      async run({ args }) {
        try {
          const client = createClientFromArgs(args as unknown as GlobalArgs);
          const input = await readDataInput(args.data);
          const result = await client.exceptions.submitAppeal(input as any);
          printJson(result);
        } catch (error: any) {
          printError(error.message);
          process.exit(1);
        }
      },
    }),
    "warehouse-process": defineCommand({
      meta: { name: "warehouse-process", description: "Request a warehouse exception process" },
      args: {
        ...globalArgs,
        data: {
          type: "string",
          description: "JSON payload or @file path (e.g. --data @warehouse-process.json)",
          required: true,
        },
      },
      async run({ args }) {
        try {
          const client = createClientFromArgs(args as unknown as GlobalArgs);
          const input = await readDataInput(args.data);
          const result = await client.exceptions.requestWarehouseProcess(input as any);
          printJson(result);
        } catch (error: any) {
          printError(error.message);
          process.exit(1);
        }
      },
    }),
    "change-waybill-number": defineCommand({
      meta: {
        name: "change-waybill-number",
        description: "Change or reprint an exception waybill",
      },
      args: {
        ...globalArgs,
        data: {
          type: "string",
          description: "JSON payload or @file path (e.g. --data @change-waybill.json)",
          required: true,
        },
      },
      async run({ args }) {
        try {
          const client = createClientFromArgs(args as unknown as GlobalArgs);
          const input = await readDataInput(args.data);
          const result = await client.exceptions.changeWaybillNumber(input as any);
          printJson(result);
        } catch (error: any) {
          printError(error.message);
          process.exit(1);
        }
      },
    }),
    "return-supply": defineCommand({
      meta: {
        name: "return-supply",
        description: "Supply return address information for an exception order",
      },
      args: {
        ...globalArgs,
        data: {
          type: "string",
          description: "JSON payload or @file path (e.g. --data @return-supply.json)",
          required: true,
        },
      },
      async run({ args }) {
        try {
          const client = createClientFromArgs(args as unknown as GlobalArgs);
          const input = await readDataInput(args.data);
          const result = await client.exceptions.supplyReturn(input as any);
          printJson(result);
        } catch (error: any) {
          printError(error.message);
          process.exit(1);
        }
      },
    }),
    "re-forecast": defineCommand({
      meta: { name: "re-forecast", description: "Re-forecast receiver and declaration info" },
      args: {
        ...globalArgs,
        data: {
          type: "string",
          description: "JSON payload or @file path (e.g. --data @re-forecast.json)",
          required: true,
        },
      },
      async run({ args }) {
        try {
          const client = createClientFromArgs(args as unknown as GlobalArgs);
          const input = await readDataInput(args.data);
          const result = await client.exceptions.reForecast(input as any);
          printJson(result);
        } catch (error: any) {
          printError(error.message);
          process.exit(1);
        }
      },
    }),
    "retry-delivery": defineCommand({
      meta: { name: "retry-delivery", description: "Retry delivery for an exception order" },
      args: {
        ...globalArgs,
        data: {
          type: "string",
          description: "JSON payload or @file path (e.g. --data @retry-delivery.json)",
          required: true,
        },
      },
      async run({ args }) {
        try {
          const client = createClientFromArgs(args as unknown as GlobalArgs);
          const input = await readDataInput(args.data);
          const result = await client.exceptions.retryDelivery(input as any);
          printJson(result);
        } catch (error: any) {
          printError(error.message);
          process.exit(1);
        }
      },
    }),
    "select-solution": defineCommand({
      meta: { name: "select-solution", description: "Select an exception handling solution" },
      args: {
        ...globalArgs,
        data: {
          type: "string",
          description: "JSON payload or @file path (e.g. --data @select-solution.json)",
          required: true,
        },
      },
      async run({ args }) {
        try {
          const client = createClientFromArgs(args as unknown as GlobalArgs);
          const input = await readDataInput(args.data);
          const result = await client.exceptions.selectSolution(input as any);
          printJson(result);
        } catch (error: any) {
          printError(error.message);
          process.exit(1);
        }
      },
    }),
    "customer-feedback": defineCommand({
      meta: {
        name: "customer-feedback",
        description: "Submit customer feedback for an exception order",
      },
      args: {
        ...globalArgs,
        data: {
          type: "string",
          description: "JSON payload or @file path (e.g. --data @customer-feedback.json)",
          required: true,
        },
      },
      async run({ args }) {
        try {
          const client = createClientFromArgs(args as unknown as GlobalArgs);
          const input = await readDataInput(args.data);
          const result = await client.exceptions.submitCustomerFeedback(input as any);
          printJson(result);
        } catch (error: any) {
          printError(error.message);
          process.exit(1);
        }
      },
    }),
    "modify-declaration-info": defineCommand({
      meta: {
        name: "modify-declaration-info",
        description: "Modify customs declaration info for an exception order",
      },
      args: {
        ...globalArgs,
        data: {
          type: "string",
          description: "JSON payload or @file path (e.g. --data @modify-declaration.json)",
          required: true,
        },
      },
      async run({ args }) {
        try {
          const client = createClientFromArgs(args as unknown as GlobalArgs);
          const input = await readDataInput(args.data);
          const result = await client.exceptions.modifyDeclarationInfo(input as any);
          printJson(result);
        } catch (error: any) {
          printError(error.message);
          process.exit(1);
        }
      },
    }),
  },
});
