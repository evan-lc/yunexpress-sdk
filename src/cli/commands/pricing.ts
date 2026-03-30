import { defineCommand } from "citty";
import { createClientFromArgs } from "../config.ts";
import { printError, printJson, readDataInput } from "../output.ts";
import { globalArgs, type GlobalArgs } from "../shared.ts";

export const pricingCommand = defineCommand({
  meta: { name: "pricing", description: "Pricing operations" },
  subCommands: {
    trial: defineCommand({
      meta: { name: "trial", description: "Get price trial estimates" },
      args: {
        ...globalArgs,
        "country-code": {
          type: "string",
          description: "2-letter ISO country code",
          required: true,
        },
        weight: {
          type: "string",
          description: "Weight (0.001 - 1000)",
          required: true,
        },
        "weight-unit": {
          type: "string",
          description: '"G", "KG", or "LBS"',
        },
        "package-type": {
          type: "string",
          description: '"C" (document), "E" (express), or "F" (freight)',
        },
        "postal-code": {
          type: "string",
          description: "Destination postal code",
        },
        "product-group-code": {
          type: "string",
          description: "Product group code",
        },
        pieces: {
          type: "string",
          description: "Number of pieces",
        },
        length: {
          type: "string",
          description: "Package length",
        },
        width: {
          type: "string",
          description: "Package width",
        },
        height: {
          type: "string",
          description: "Package height",
        },
        "size-unit": {
          type: "string",
          description: '"CM" or "INCH"',
        },
        origin: {
          type: "string",
          description: "Origin country code",
        },
      },
      async run({ args }) {
        try {
          const client = createClientFromArgs(args as unknown as GlobalArgs);
          const result = await client.pricing.getPriceTrial({
            countryCode: args["country-code"],
            weight: Number(args.weight),
            weightUnit: args["weight-unit"] as any,
            packageType: args["package-type"] as any,
            postalCode: args["postal-code"],
            productGroupCode: args["product-group-code"],
            pieces: args.pieces ? Number(args.pieces) : undefined,
            length: args.length ? Number(args.length) : undefined,
            width: args.width ? Number(args.width) : undefined,
            height: args.height ? Number(args.height) : undefined,
            sizeUnit: args["size-unit"] as any,
            origin: args.origin,
          });
          printJson(result);
        } catch (error: any) {
          printError(error.message);
          process.exit(1);
        }
      },
    }),
    "trial-v2": defineCommand({
      meta: { name: "trial-v2", description: "Get price trial V2 estimates" },
      args: {
        ...globalArgs,
        data: {
          type: "string",
          description: "JSON payload or @file path (e.g. --data @trial-v2.json)",
          required: true,
        },
      },
      async run({ args }) {
        try {
          const client = createClientFromArgs(args as unknown as GlobalArgs);
          const input = await readDataInput(args.data);
          const result = await client.pricing.getPriceTrialV2(input as any);
          printJson(result);
        } catch (error: any) {
          printError(error.message);
          process.exit(1);
        }
      },
    }),
  },
});
