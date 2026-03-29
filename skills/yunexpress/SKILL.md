---
name: yunexpress
description: >
  Operate YunExpress international shipping through the yunexpress CLI on behalf of users who may not be developers.
  Use this skill whenever the user mentions YunExpress, international shipping labels, waybills, cross-border parcels,
  tracking shipments, shipping cost estimates, customs declarations, or managing logistics orders — even if they
  don't mention "CLI" or "SDK". Also trigger when the user wants to cancel or hold a shipment, check billing,
  handle shipping exceptions, create return orders, or look up supported countries and products for a logistics provider.
  Do NOT use this skill for questions about contributing to or extending the yunexpress-sdk codebase itself.
---

# YunExpress CLI Skill

You are helping a non-technical user manage their YunExpress international shipping operations. Your job is to translate what they want to do — in plain language — into the correct `yunexpress` CLI commands, run them, and explain the results in a way that makes sense to someone who is not a developer.

## Before you start

The CLI binary is `yunexpress` (installed from the `yunexpress-sdk` package). Before running any commands, make sure the CLI is available:

```bash
yunexpress --help
```

If it's not found, install the package first:

```bash
npm install -g yunexpress-sdk
```

## Authentication setup

The CLI needs credentials to talk to the YunExpress API. There are two environments:

| Environment    | What it's for                            | Required credentials                                  |
| -------------- | ---------------------------------------- | ----------------------------------------------------- |
| **Sandbox**    | Testing without affecting real shipments | `--access-token`                                      |
| **Production** | Real shipments                           | `--app-id` + `--api-key` (auto-exchanges for a token) |

**How credentials are resolved** (first match wins):

1. CLI flags (`--app-id`, `--api-key`, `--access-token`, `--environment`)
2. Environment variables (`YUNEXPRESS_APP_ID`, `YUNEXPRESS_API_KEY`, `YUNEXPRESS_ACCESS_TOKEN`, `YUNEXPRESS_ENVIRONMENT`)
3. Config file at `~/.yunexpressrc.json`

If the user hasn't set up credentials yet, help them create a config file:

```json
{
  "appId": "their-app-id",
  "apiKey": "their-api-key",
  "environment": "production"
}
```

Save it to `~/.yunexpressrc.json`. Ask the user for their credentials — never invent or guess them.

For sandbox testing, the config looks like:

```json
{
  "accessToken": "their-sandbox-token",
  "environment": "sandbox"
}
```

## Command reference

Every command follows the pattern: `yunexpress <resource> <action> [options]`

### Orders — creating and managing shipments

**Create a shipment:**

```bash
yunexpress orders create --data @order.json
# or inline:
yunexpress orders create --data '{ ... }'
# or pipe from stdin:
cat order.json | yunexpress orders create --data -
```

An order payload needs at minimum:

- `productCode` — the shipping product (run `yunexpress basic products` to see available ones)
- `customerOrderNumber` — your own reference number
- `weightUnit` — "KG", "G", or "LBS"
- `sizeUnit` — "CM" or "IN"
- `packages` — array with at least one item containing `weight` (and optionally `length`, `width`, `height`)
- `receiver` — who's getting the package (`name`, `countryCode`, `addressLine1`, `city`, `postalCode`, `phone`)
- `declarationInfo` — customs declaration items (`name`, `quantity`, `declaredValue`, `currency`, `unitWeight`)

When the user describes a shipment in plain language (e.g., "I need to ship a 1.5kg package to the US"), build the JSON payload for them based on what they told you. Ask for any missing required fields.

**Example payload:**

```json
{
  "productCode": "STANDARD",
  "customerOrderNumber": "MY-ORDER-001",
  "weightUnit": "KG",
  "sizeUnit": "CM",
  "packages": [{ "weight": 1.5, "length": 20, "width": 15, "height": 10 }],
  "receiver": {
    "name": "Jane Smith",
    "countryCode": "US",
    "addressLine1": "123 Main Street",
    "city": "New York",
    "postalCode": "10001",
    "phone": "+1-555-1234",
    "email": "jane@example.com"
  },
  "declarationInfo": [
    {
      "name": "Cotton T-Shirt",
      "quantity": 2,
      "declaredValue": 25.0,
      "currency": "USD",
      "unitWeight": 0.3
    }
  ]
}
```

**Look up an order:**

```bash
yunexpress orders get --order-number YT2231431267000001
```

**Get sender info for an order:**

```bash
yunexpress orders get-sender --order-number YT2231431267000001
```

**Check last-mile carriers** (which local carrier delivers the final leg):

```bash
yunexpress orders last-mile-carriers --waybill-numbers YT001,YT002
```

**Modify the weight** of a shipment (before it's picked up):

```bash
yunexpress orders modify-weight --waybill-number YT001 --weight 2.0 --weight-unit KG
```

**Cancel an order:**

```bash
yunexpress orders cancel --waybill-number YT001
```

### Tracking — where's my package?

**Get tracking info:**

```bash
yunexpress tracking get --order-number YT2231431267000001
```

**Subscribe to tracking updates** (push notifications for status changes):

```bash
yunexpress tracking subscribe-waybill --waybill-numbers YT001,YT002 --subscription-mode 1
yunexpress tracking subscribe-product --product-codes STANDARD,EXPRESS --subscription-mode 1
```

**Cancel tracking subscription:**

```bash
yunexpress tracking cancel-waybill --waybill-numbers YT001,YT002
yunexpress tracking cancel-product --product-codes STANDARD
```

**Check subscription status:**

```bash
yunexpress tracking get-waybill-sub --waybill-numbers YT001,YT002
yunexpress tracking get-product-sub --product-code STANDARD
```

### Labels — printing shipping documents

**Get a shipping label:**

```bash
yunexpress labels get --order-number YT2231431267000001
```

**Get all shipping documents:**

```bash
yunexpress labels shipping-docs --order-number YT2231431267000001
```

**Get proof of delivery:**

```bash
yunexpress labels pod --order-number YT2231431267000001
```

### Pricing — how much will it cost?

**Get a shipping price estimate:**

```bash
yunexpress pricing trial \
  --country-code US \
  --weight 0.5 \
  --weight-unit KG \
  --package-type 1 \
  --postal-code 10001
```

Optional pricing flags: `--product-group-code`, `--pieces`, `--length`, `--width`, `--height`, `--size-unit`, `--origin`.

### Exceptions — handling shipment problems

**Release (resolve) a shipment issue:**

```bash
yunexpress exceptions release --waybill-number YT001 --remark "Issue resolved"
```

Optional: `--new-waybill-numbers`, `--extra-codes`.

### Returns — return shipments

**Create a return order:**

```bash
yunexpress returns create --data @return-payload.json
```

The return payload uses the same `--data` pattern as order creation (JSON string, `@file`, or `-` for stdin).

### Billing — costs and invoices

**Get billing detail by bill code and type:**

```bash
yunexpress billing detail --bill-code BILL202403 --bill-type N
```

**Paginate billing detail results:**

```bash
yunexpress billing detail --bill-code BILL202403 --bill-type N --page-no 1 --page-size 10
```

**Get freight detail:**

```bash
yunexpress billing freight --waybill-number YT001
```

Pagination: `--page-no 1 --page-size 10`

### Basic lookups — what countries and products are available?

**List supported countries:**

```bash
yunexpress basic countries
```

**List available shipping products:**

```bash
yunexpress basic products
```

These are useful reference commands — run them when the user needs to know which country codes or product codes to use.

## How to present results

The CLI outputs JSON. Your job is to translate that into a clear, human-readable summary. Some guidelines:

- **Order creation**: Tell the user their waybill number and tracking number. These are the identifiers they'll need going forward.
- **Tracking**: Summarize the current status in plain language. If there are multiple tracking events, show them as a timeline from newest to oldest.
- **Pricing**: Show the estimated cost prominently, with currency. Mention any surcharges.
- **Labels**: The response may contain a URL or base64-encoded PDF. If it's a URL, give it to the user. If it's base64, save it to a file and tell them where.
- **Errors**: Translate error codes into plain language. Common issues:
  - Authentication failures → "Your credentials seem wrong. Let's check your config."
  - Rate limiting → "Too many requests. Let's wait a moment and try again."
  - Validation errors → Explain which field is wrong and what it should look like.
  - Network errors → "Couldn't reach the YunExpress servers. Check your internet connection."

## Common workflows

### "I want to ship a package"

1. Ask: Where is it going? How heavy is it? What's in it?
2. Run `yunexpress basic products` to suggest suitable products
3. Optionally run `yunexpress pricing trial ...` to show cost estimates
4. Build the order JSON from their answers
5. Run `yunexpress orders create --data '...'`
6. Report the waybill number and tracking number

### "Where is my package?"

1. Ask for their order number or waybill number
2. Run `yunexpress tracking get --order-number ...`
3. Summarize the status in plain language

### "How much will shipping cost?"

1. Ask: destination country, weight, and optionally dimensions
2. Run `yunexpress pricing trial --country-code XX --weight N --weight-unit KG`
3. Present the price clearly

### "I need to cancel/change a shipment"

1. Ask for the waybill number
2. For cancellation: `yunexpress orders cancel --waybill-number ...`
3. For weight change: `yunexpress orders modify-weight --waybill-number ... --weight N --weight-unit KG`
4. Confirm success or explain why it failed (e.g., already shipped)

### "I need a shipping label"

1. Ask for the order number
2. `yunexpress labels get --order-number ...`
3. If the response has a download URL, share it. If it returns base64 data, save to a file.

## Important notes

- **Never guess credentials.** Always ask the user for their appId, apiKey, or accessToken.
- **Always confirm before destructive actions.** Before cancelling an order, confirm with the user: "Are you sure you want to cancel waybill YT001?"
- **Use `--debug` when troubleshooting.** Append `--debug` to any command to see the raw request/response, which helps diagnose issues.
- **Country codes are two-letter ISO codes** (US, CN, DE, etc.). If the user says a country name, convert it to the code.
- **Waybill numbers typically start with "YT"** — if the user gives you just a number, they may mean the customer order number instead. The `orders get` command accepts `--order-number` which can be either.
