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
        "bill-code": {
          type: "string",
          description: "Billing code",
          required: true,
        },
        "bill-type": {
          type: "string",
          description: "Billing type: I, Q, T, N, K, C, R, V, TJ, TT",
          required: true,
        },
        "page-no": {
          type: "string",
          description: "Page number (defaults to 1)",
        },
        "page-size": {
          type: "string",
          description: "Number of items per page (defaults to 10)",
        },
      },
      async run({ args }) {
        try {
          const client = createClientFromArgs(args as unknown as GlobalArgs);
          const result = await client.billing.getBillingDetail({
            billCode: args["bill-code"],
            billType: args["bill-type"] as
              | "I"
              | "Q"
              | "T"
              | "N"
              | "K"
              | "C"
              | "R"
              | "V"
              | "TJ"
              | "TT",
            pageNo: args["page-no"] ? Number(args["page-no"]) : undefined,
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
