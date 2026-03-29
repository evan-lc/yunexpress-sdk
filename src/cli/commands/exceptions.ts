import { defineCommand } from "citty";
import { createClientFromArgs } from "../config.ts";
import { printError, printJson } from "../output.ts";
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
  },
});
