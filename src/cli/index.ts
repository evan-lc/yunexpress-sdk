#!/usr/bin/env node
import { defineCommand, runMain } from "citty";
import { b2bCommand } from "./commands/b2b.ts";
import { basicCommand } from "./commands/basic.ts";
import { billingCommand } from "./commands/billing.ts";
import { exceptionsCommand } from "./commands/exceptions.ts";
import { labelsCommand } from "./commands/labels.ts";
import { ordersCommand } from "./commands/orders.ts";
import { pricingCommand } from "./commands/pricing.ts";
import { returnsCommand } from "./commands/returns.ts";
import { trackingCommand } from "./commands/tracking.ts";

const main = defineCommand({
  meta: {
    name: "yunexpress",
    version: "0.1.0",
    description: "YunExpress OpenAPI CLI",
  },
  subCommands: {
    b2b: b2bCommand,
    orders: ordersCommand,
    tracking: trackingCommand,
    labels: labelsCommand,
    pricing: pricingCommand,
    exceptions: exceptionsCommand,
    returns: returnsCommand,
    billing: billingCommand,
    basic: basicCommand,
  },
});

void runMain(main);
