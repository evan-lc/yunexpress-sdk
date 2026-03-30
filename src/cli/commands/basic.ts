import { defineCommand } from "citty";
import { createClientFromArgs } from "../config.ts";
import { printError, printJson, readDataInput } from "../output.ts";
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
    "register-ioss": defineCommand({
      meta: { name: "register-ioss", description: "Register an IOSS number" },
      args: {
        ...globalArgs,
        data: {
          type: "string",
          description: "JSON payload or @file path (e.g. --data @ioss.json)",
          required: true,
        },
      },
      async run({ args }) {
        try {
          const client = createClientFromArgs(args as unknown as GlobalArgs);
          const input = await readDataInput(args.data);
          const result = await client.basic.registerIoss(input as any);
          printJson(result);
        } catch (error: any) {
          printError(error.message);
          process.exit(1);
        }
      },
    }),
    "register-vat": defineCommand({
      meta: { name: "register-vat", description: "Register a VAT number" },
      args: {
        ...globalArgs,
        data: {
          type: "string",
          description: "JSON payload or @file path (e.g. --data @vat.json)",
          required: true,
        },
      },
      async run({ args }) {
        try {
          const client = createClientFromArgs(args as unknown as GlobalArgs);
          const input = await readDataInput(args.data);
          const result = await client.basic.registerVat(input as any);
          printJson(result);
        } catch (error: any) {
          printError(error.message);
          process.exit(1);
        }
      },
    }),
  },
});
