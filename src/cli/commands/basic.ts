import { defineCommand } from "citty";
import { createClientFromArgs } from "../config.ts";
import { printError, printJson } from "../output.ts";
import { globalArgs, type GlobalArgs } from "../shared.ts";

export const basicCommand = defineCommand({
  meta: { name: "basic", description: "Basic data lookups" },
  subCommands: {
    countries: defineCommand({
      meta: { name: "countries", description: "List all supported country codes" },
      args: { ...globalArgs },
      async run({ args }) {
        try {
          const client = createClientFromArgs(args as unknown as GlobalArgs);
          const result = await client.basic.getCountryCodes();
          printJson(result);
        } catch (error: any) {
          printError(error.message);
          process.exit(1);
        }
      },
    }),
    products: defineCommand({
      meta: { name: "products", description: "List all available products" },
      args: {
        ...globalArgs,
        "country-code": {
          type: "string",
          description: "Optional country code filter",
        },
      },
      async run({ args }) {
        try {
          const client = createClientFromArgs(args as unknown as GlobalArgs);
          const result = await client.basic.getProducts({
            countryCode: args["country-code"],
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
