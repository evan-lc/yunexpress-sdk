import { defineCommand } from "citty";
import { createClientFromArgs } from "../config.ts";
import { printError, printJson } from "../output.ts";
import { globalArgs, type GlobalArgs } from "../shared.ts";

export const exceptionsCommand = defineCommand({
  meta: { name: "exceptions", description: "Exception handling operations" },
  subCommands: {
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
