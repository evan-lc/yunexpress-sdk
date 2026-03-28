import { defineCommand } from "citty";
import { createClientFromArgs } from "../config.ts";
import { printError, printJson } from "../output.ts";
import { globalArgs, type GlobalArgs } from "../shared.ts";

export const billingCommand = defineCommand({
  meta: { name: "billing", description: "Billing operations" },
  subCommands: {
    detail: defineCommand({
      meta: { name: "detail", description: "Get billing detail" },
      args: {
        ...globalArgs,
        "waybill-number": {
          type: "string",
          description: "Waybill number filter",
        },
        "start-date": {
          type: "string",
          description: "Start date filter (e.g. 2024-01-01)",
        },
        "end-date": {
          type: "string",
          description: "End date filter (e.g. 2024-12-31)",
        },
        page: {
          type: "string",
          description: "Page number",
        },
        "page-size": {
          type: "string",
          description: "Number of items per page",
        },
      },
      async run({ args }) {
        try {
          const client = createClientFromArgs(args as unknown as GlobalArgs);
          const result = await client.billing.getBillingDetail({
            waybillNumber: args["waybill-number"],
            startDate: args["start-date"],
            endDate: args["end-date"],
            page: args.page ? Number(args.page) : undefined,
            pageSize: args["page-size"] ? Number(args["page-size"]) : undefined,
          });
          printJson(result);
        } catch (error: any) {
          printError(error.message);
          process.exit(1);
        }
      },
    }),
    freight: defineCommand({
      meta: { name: "freight", description: "Get freight detail for a waybill" },
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
          const result = await client.billing.getFreightDetail({
            waybillNumber: args["waybill-number"],
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
