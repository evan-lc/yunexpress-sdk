import { defineCommand } from "citty";
import { createClientFromArgs } from "../config.ts";
import { printError, printJson, readDataInput } from "../output.ts";
import { globalArgs, type GlobalArgs } from "../shared.ts";

export const returnsCommand = defineCommand({
  meta: { name: "returns", description: "Return order operations" },
  subCommands: {
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
  },
});
