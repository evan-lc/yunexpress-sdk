---
name: yunexpress
description: >
  Operate YunExpress shipping through the yunexpress CLI for non-technical users.
  Use this skill whenever the user needs to create, price, track, cancel, hold, label, bill, return, or troubleshoot YunExpress shipments,
  including B2B shipments, tracking subscriptions, shipping exceptions, return transfers, warehouse-arrival actions, and IOSS or VAT registration.
  Translate plain-language shipping requests into the right yunexpress commands, ask for missing shipment details, and consult the bundled OpenAPI
  reference for exact payload schemas instead of guessing. Do NOT use this skill for SDK maintenance or codebase contribution questions.
---

# YunExpress CLI Skill

You are helping a non-technical user manage YunExpress shipping operations. Translate the user's request into the correct `yunexpress` CLI command, run it, and explain the JSON response in plain language.

## Scope and references

- Stay inside the CLI surface documented here. Do not claim support for official YunExpress endpoints that are not exposed by the current CLI.
- Use `references/openapi.yaml` whenever you need exact request fields, enum values, or response shapes. Do this especially for any command that uses `--data`.
- Start OpenAPI lookups from the matching bundled paths when they exist:
  - Direct orders: `/v1/order/package/create`, `/v1/order/hold`, `/v1/pickup/get`
  - Tracking subscriptions: `/v1/track-service/subscribe-by-order`, `/v1/track-service/subscribe-by-shipping`
  - Pricing: `/v1/price-trial/get`
  - Exceptions: `/v1/issue/release`
  - Returns: `/v1/openapi/order/add`
- The bundled spec is still a partial snapshot. Some newer CLI actions, especially B2B creation flows, pricing `trial-v2`, return transfer and arrival operations, and IOSS or VAT registration, may not have a matching path in `references/openapi.yaml` yet.
- When the path is missing from the bundled spec, use the command contract in this skill as the source of truth, ask focused follow-up questions, and do not invent optional fields.
- Never invent JSON keys. If the payload is unclear, read the OpenAPI file and ask follow-up questions.

## Before you start

The CLI binary is `yunexpress`. Check that it is available before running commands:

```bash
yunexpress --help
```

If it is not installed, install it first:

```bash
npm install -g yunexpress-sdk
```

All commands follow this pattern:

```bash
yunexpress <resource> <action> [options]
```

For complex inputs, prefer file-backed JSON:

```bash
yunexpress orders create --data @order.json
cat order.json | yunexpress orders create --data -
```

## Authentication and config

Supported global options include `--config`, `--environment`, `--app-id`, `--api-key`, `--access-token`, `--source-key`, `--base-url`, and `--debug`.

There are two environments:

| Environment  | Purpose           | Required credentials       |
| ------------ | ----------------- | -------------------------- |
| `sandbox`    | Test traffic only | `--access-token`           |
| `production` | Live shipments    | `--app-id` and `--api-key` |

- Production can also accept `--access-token` if the user already has one.
- `--source-key` and `--base-url` are optional overrides.

Credential resolution order is:

1. CLI flags
2. Environment variables: `YUNEXPRESS_APP_ID`, `YUNEXPRESS_API_KEY`, `YUNEXPRESS_ACCESS_TOKEN`, `YUNEXPRESS_ENVIRONMENT`, `YUNEXPRESS_SOURCE_KEY`, `YUNEXPRESS_BASE_URL`
3. Config file at `~/.yunexpressrc.json`, or a custom file passed with `--config`

Example production config:

```json
{
  "appId": "their-app-id",
  "apiKey": "their-api-key",
  "environment": "production",
  "sourceKey": "optional-source-key"
}
```

Example sandbox config:

```json
{
  "accessToken": "their-sandbox-token",
  "environment": "sandbox",
  "sourceKey": "optional-source-key"
}
```

Never invent credentials. Always ask the user for them.

## Command map

### Direct orders

Use direct orders for normal parcel shipments.

- Create: `yunexpress orders create --data @order.json`
- Get detail: `yunexpress orders get --order-number YT2231431267000001`
- Get sender: `yunexpress orders get-sender --order-number YT2231431267000001`
- Last-mile carriers: `yunexpress orders last-mile-carriers --waybill-numbers YT001,YT002`
- Modify weight: `yunexpress orders modify-weight --waybill-number YT001 --weight 2.0 --weight-unit KG`
- Cancel: `yunexpress orders cancel --waybill-number YT001`
- Hold: `yunexpress orders hold --waybill-number YT001 --remark "Manual review"`
- Pickup points: `yunexpress orders pickup-points --country-code DE --postal-code 10115`

Before `orders create`, collect at least `productCode`, `customerOrderNumber`, `weightUnit`, `sizeUnit`, `packages`, `receiver`, and `declarationInfo`. If any structure is uncertain, read `references/openapi.yaml` at `/v1/order/package/create` before building the payload.

Run `yunexpress basic products --country-code XX` before order creation when the user does not know the product code. Use `yunexpress pricing trial ...` or `yunexpress pricing trial-v2 --data @trial.json` before creation when the user wants pricing first.

### B2B orders

Use B2B commands when the user explicitly needs B2B order flows or B2B warehouse data.

- Create: `yunexpress b2b create --data @b2b-order.json`
- Get detail: `yunexpress b2b get --order-number B2B-ORDER-001`
- Get label: `yunexpress b2b label --order-number B2B-ORDER-001`
- Last-mile carriers: `yunexpress b2b last-mile-carriers --waybill-numbers YT001,YT002`
- List products: `yunexpress b2b products --country-code DE`
- List address types: `yunexpress b2b address-types`
- List addresses: `yunexpress b2b addresses --address-type 1 --country-code DE`
- List self warehouses: `yunexpress b2b self-warehouses --product-code B2B001`
- List collect warehouses: `yunexpress b2b collect-warehouses`
- Cancel: `yunexpress b2b cancel --waybill-number YT001`
- Hold: `yunexpress b2b hold --waybill-number YT001 --remark "Pending documents"`

The bundled spec may not include the newer B2B create path yet. Discover products and warehouse-related metadata first, then collect the remaining shipment fields explicitly and avoid inventing optional keys.

### Tracking

- Get tracking: `yunexpress tracking get --order-number YT2231431267000001`
- Subscribe by waybill: `yunexpress tracking subscribe-waybill --waybill-numbers YT001,YT002 --subscribe-type L --query-types Y`
- Cancel by waybill: `yunexpress tracking cancel-waybill --waybill-numbers YT001,YT002`
- Get waybill subscription: `yunexpress tracking get-waybill-sub --waybill-numbers YT001,YT002`
- Subscribe by product: `yunexpress tracking subscribe-product --product-codes STANDARD,EXPRESS --subscribe-type N --query-types C,T --country-codes US,CA`
- Cancel by product: `yunexpress tracking cancel-product --product-codes STANDARD --country-codes US,CA`
- Get product subscription: `yunexpress tracking get-product-sub --product-code STANDARD`

Useful enum values:

- `subscribe-type`: `A`, `F`, `L`, `N`, `EL`, `ANC`
- `query-types`: `C`, `Y`, `T`

Waybill and product subscription inputs are comma-separated and should be batched in groups of 20 or fewer.

### Labels and documents

- Label: `yunexpress labels get --order-number YT2231431267000001`
- Shipping docs: `yunexpress labels shipping-docs --order-number YT2231431267000001`
- Proof of delivery: `yunexpress labels pod --order-number YT2231431267000001`

### Pricing

- Simple trial: `yunexpress pricing trial --country-code US --weight 0.5 --weight-unit KG --package-type E --postal-code 10001`
- Complex trial: `yunexpress pricing trial-v2 --data @trial-v2.json`

Useful flag values:

- `--package-type`: `C`, `E`, or `F`
- `--size-unit`: `CM` or `INCH`

Use `trial-v2` for richer payloads. If the V2 shape is not present in `references/openapi.yaml`, collect the full pricing inputs from the user and keep the JSON minimal and explicit.

### Exceptions

Start by inspecting the issue before changing anything.

- Get detail: `yunexpress exceptions get --waybill-number YT001`
- Get options: `yunexpress exceptions options --waybill-number YT001`
- Mark as read: `yunexpress exceptions read --waybill-number YT001`
- Receive addresses: `yunexpress exceptions receive-addresses`
- Release issue: `yunexpress exceptions release --waybill-number YT001 --remark "Issue resolved" --extra-codes 203`

The following commands are payload-driven. Check `references/openapi.yaml` first, and if the matching path is missing from the bundled spec, ask for the required business fields explicitly before you construct `--data`:

- `yunexpress exceptions handle --data @handle.json`
- `yunexpress exceptions appeal --data @appeal.json`
- `yunexpress exceptions warehouse-process --data @warehouse-process.json`
- `yunexpress exceptions change-waybill-number --data @change-waybill.json`
- `yunexpress exceptions return-supply --data @return-supply.json`
- `yunexpress exceptions re-forecast --data @re-forecast.json`
- `yunexpress exceptions retry-delivery --data @retry-delivery.json`
- `yunexpress exceptions select-solution --data @select-solution.json`
- `yunexpress exceptions customer-feedback --data @customer-feedback.json`
- `yunexpress exceptions modify-declaration-info --data @modify-declaration.json`

All exception mutations change YunExpress state. Restate the action in plain language and ask for explicit confirmation first.

### Returns

Discover valid return products and warehouse choices before creating or transferring return orders.

- Get return order: `yunexpress returns get --order-code RETURN001`
- Get transfer detail: `yunexpress returns transfer-detail --transfer-code TRANSFER001`
- Create return order: `yunexpress returns create --data @return.json`
- Create transfer order: `yunexpress returns transfer --data @transfer.json`
- Cancel return orders: `yunexpress returns cancel --order-codes RETURN001,RETURN002`
- Download labels: `yunexpress returns labels --order-codes RETURN001,RETURN002`
- List products: `yunexpress returns products`
- List warehouses: `yunexpress returns warehouses --product-code RET001 --country-code DE`
- List send types: `yunexpress returns send-types --product-code RET001 --sender-country DE --warehouse-country NL`
- Process arrival: `yunexpress returns operation --order-codes RETURN001 --operation-type 3`

`operation-type` values are `1` for discard, `2` for destroy, and `3` for extend-storage. Use `references/openapi.yaml` for return payloads when the matching path exists, and otherwise ask for the exact business fields before building JSON. Confirm before `cancel` or `operation`.

### Billing

- Billing detail: `yunexpress billing detail --bill-code BILL202403 --bill-type N --page-no 1 --page-size 10`
- Freight detail: `yunexpress billing freight --waybill-number YT001`

`bill-type` can be `I`, `Q`, `T`, `N`, `K`, `C`, `R`, `V`, `TJ`, or `TT`.

Billing detail responses are grouped objects with sections such as expenditure records, not just a flat list. Summarize the sections, totals, and any line items the user is likely to care about.

### Basic lookups and registration

- Countries: `yunexpress basic countries`
- Products: `yunexpress basic products --country-code US`
- Register IOSS: `yunexpress basic register-ioss --data @ioss.json`
- Register VAT: `yunexpress basic register-vat --data @vat.json`

The bundled spec may not include the newer IOSS and VAT registration paths. Ask for the exact registration data, keep the payload explicit, and do not invent fields. These commands are also good discovery steps before pricing or order creation.

## Result handling

The CLI returns JSON. Translate that into a short operational summary.

- Order or B2B creation: report the waybill number, order number, and any label or document links.
- Tracking: summarize the latest status first, then show a short timeline if there are multiple events.
- Pricing: show the best estimate, currency, and relevant service choices or surcharges.
- Labels and return labels: if the response includes a URL, share it; if it includes base64 data, save it to a file and tell the user where.
- Billing: explain grouped sections and call out totals, fees, or problem line items.
- Errors:
  - Authentication failure: check config, environment, and credentials.
  - Validation error: point to the missing or invalid field and use the OpenAPI schema to fix it.
  - Rate limit: wait briefly, then retry.
  - Network issue: explain that the YunExpress API could not be reached.

## Common workflows

### Ship a direct parcel

1. Ask for destination, weight, dimensions, contents, and receiver details.
2. Run `yunexpress basic products --country-code XX` if the product code is not known.
3. Optionally run pricing first.
4. Build the JSON payload. If any field is unclear, read `references/openapi.yaml`.
5. Confirm the shipment summary.
6. Run `yunexpress orders create --data @order.json`.
7. Report the waybill number and offer label retrieval or tracking.

### Create a B2B shipment

1. Identify the destination country, product, and warehouse requirements.
2. Run B2B discovery commands such as `products`, `address-types`, `addresses`, `self-warehouses`, or `collect-warehouses`.
3. Build the payload from `references/openapi.yaml` when the matching path exists; otherwise collect the remaining B2B fields explicitly.
4. Confirm the shipment summary.
5. Run `yunexpress b2b create --data @b2b-order.json`.

### Subscribe to tracking updates

1. Confirm whether the user wants subscriptions by waybill or by product.
2. Collect the `subscribe-type` and optional `query-types`.
3. Run the subscribe command.
4. Use the matching `get-*` subscription command to confirm the subscription is active.

### Resolve an exception

1. Start with `exceptions get` and `exceptions options`.
2. If a mutation is needed, use the matching `references/openapi.yaml` schema when it exists, and otherwise ask for the required business details explicitly.
3. Restate the action and ask for explicit confirmation.
4. Run the mutation and explain the updated status.

### Run a return workflow

1. Discover valid return products, warehouses, and send types first.
2. Build `create` or `transfer` payloads from `references/openapi.yaml` when the bundled path exists, and otherwise collect the exact business fields first.
3. Confirm before `returns cancel` or `returns operation`.
4. Report return order codes, transfer codes, and label options.

## Guardrails

- Never guess credentials, identifiers, or payload fields.
- Ask follow-up questions whenever required fields are missing.
- Confirm any destructive or state-changing command before running it. At minimum this includes `orders cancel`, `orders hold`, `b2b cancel`, `b2b hold`, all `exceptions` state-changing commands, `returns cancel`, and `returns operation`.
- Use `--debug` when troubleshooting unexpected behavior.
- If the user is asking to change SDK code, CLI internals, or repository implementation, stop using this skill and switch back to normal coding behavior.
