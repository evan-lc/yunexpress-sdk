# yunexpress-sdk

TypeScript SDK and CLI for the [YunExpress OpenAPI](https://openapi.yunexpress.cn). Ships a typed Node.js client covering orders, labels, tracking, pricing, billing, exceptions, returns, and basic data lookups, plus a `yunexpress` CLI for quick terminal access.

## Features

- Node 18+ runtime with native `fetch`
- ESM + CJS dual-format package with type declarations
- Sandbox and production environments with auto-switching base URLs
- Built-in production OAuth token exchange and HMAC-SHA256 request signing
- Replaceable signer, token provider, and request/response interceptor hooks
- Retry-aware HTTP transport with configurable retry policy
- Unified error hierarchy (`AuthenticationError`, `RateLimitError`, `UpstreamApiError`, `RequestExecutionError`)
- Full resource coverage: orders, labels, tracking, pricing, billing, exceptions, returns, basic
- CLI with all API operations available as subcommands

## Install

```bash
npm install yunexpress-sdk
```

## Develop

```bash
vp install
vp test
vp check
vp pack
```

## Quick Start

```ts
import { YunExpressClient } from "yunexpress-sdk";

const client = new YunExpressClient({
  auth: {
    kind: "sandbox",
    accessToken: process.env.YUNEXPRESS_SANDBOX_TOKEN!,
    sourceKey: process.env.YUNEXPRESS_SOURCE_KEY,
    uatAccessKey: process.env.YUNEXPRESS_UAT_ACCESS_KEY,
    signer: {
      sign: ({ date, token }) => `${date}:${token}`,
    },
    acceptLanguage: "zh-CN",
  },
  debug: true,
  timeoutMs: 10_000,
});

const response = await client.orders.createPackage(
  {
    productCode: "STANDARD",
    customerOrderNumber: "ORDER-10001",
    weightUnit: "KG",
    sizeUnit: "CM",
    packages: [
      {
        weight: 1.25,
        length: 20,
        width: 15,
        height: 10,
      },
    ],
    receiver: {
      name: "Alice Example",
      countryCode: "US",
      addressLine1: "1 Main Street",
      city: "Los Angeles",
      postalCode: "90001",
      phone: "+1-555-0100",
      email: "alice@example.com",
    },
    declarationInfo: [
      {
        name: "T-Shirt",
        quantity: 1,
        declaredValue: 12.5,
        currency: "USD",
        unitWeight: 1.25,
      },
    ],
  },
  {
    idempotencyKey: "order-10001-create-package",
  },
);

console.log(response.data.waybillNumber);
console.log(response.requestId);
```

## Environment And Auth

Default base URLs are currently set to:

- Sandbox: `https://openapi-sbx.yunexpress.cn`
- Production: `https://openapi.yunexpress.cn`

If your account uses different endpoints, override `baseUrl` explicitly.

Both built-in auth providers emit the confirmed request headers `token`, `date`, and `sign`. Production auth now supports the confirmed OAuth + signing flow out of the box, while still keeping both parts extensible:

- `appId` + `apiKey`: exchange and cache a production `accessToken` automatically
- `accessToken`: use a token that your own system already obtained
- `tokenProvider`: defer token lookup or refresh to your own async function
- `signer`: override the default signing logic when your account needs custom behavior

Production auth additionally models the confirmed `appId` and `apiKey` inputs, while sandbox auth exposes `sourceKey` and `uatAccessKey` for future token/signature flows.

```ts
const client = new YunExpressClient({
  auth: {
    kind: "production",
    appId: process.env.YUNEXPRESS_APP_ID!,
    apiKey: process.env.YUNEXPRESS_API_KEY!,
    sourceKey: process.env.YUNEXPRESS_SOURCE_KEY,
  },
});
```

## Waybill Query

`GET /v1/order/info/get` is exposed as `orders.getWaybillDetail`:

```ts
const detail = await client.orders.getWaybillDetail({
  orderNumber: "YT2231431267000001",
});

console.log(detail.data.waybill_number);
console.log(detail.data.receiver?.country_code);
```

The input is normalized to the documented query parameter `order_number`. The response currently preserves the documented wire keys such as `waybill_number`, `customer_order_number`, `packages`, `receiver`, `sender`, and `declaration_info`.

## API Coverage

All resources below are fully typed. Access them as `client.<namespace>.<method>(...)`.

| Namespace      | Method                        | Endpoint                                             |
| -------------- | ----------------------------- | ---------------------------------------------------- |
| **orders**     | `createPackage`               | `POST /v1/order/package/create`                      |
|                | `getWaybillDetail`            | `GET  /v1/order/info/get`                            |
|                | `getSender`                   | `GET  /v1/order/sender/get`                          |
|                | `getLastMileCarriers`         | `POST /v1/order/last-mile/get`                       |
|                | `modifyWeight`                | `POST /v1/order/weight/modify`                       |
|                | `cancelOrder`                 | `POST /v1/order/cancel`                              |
|                | `holdOrder`                   | `POST /v1/order/hold`                                |
|                | `getPickupPoints`             | `POST /v1/pickup/get`                                |
| **labels**     | `getLabel`                    | `GET  /v1/order/label/get`                           |
|                | `getShippingDocs`             | `GET  /v1/order/shipping-docs/get`                   |
|                | `getPod`                      | `GET  /v1/order/pod/get`                             |
| **tracking**   | `getTrackingInfo`             | `GET  /v1/track-service/info/get`                    |
|                | `subscribeByWaybill`          | `POST /v1/track-service/subscription/waybill/add`    |
|                | `cancelSubscriptionByWaybill` | `POST /v1/track-service/subscription/waybill/cancel` |
|                | `getSubscriptionByWaybill`    | `GET  /v1/track-service/subscription/waybill/get`    |
|                | `subscribeByProduct`          | `POST /v1/track-service/subscription/product/add`    |
|                | `cancelSubscriptionByProduct` | `POST /v1/track-service/subscription/product/cancel` |
|                | `getSubscriptionByProduct`    | `GET  /v1/track-service/subscription/product/get`    |
| **pricing**    | `getPriceTrial`               | `GET  /v1/price-trial/get`                           |
| **billing**    | `getBillingDetail`            | `GET  /v1/billing/detail/get`                        |
|                | `getFreightDetail`            | `GET  /v1/freight/detail/get`                        |
| **exceptions** | `releaseIssue`                | `POST /v1/issue/release`                             |
| **returns**    | `createReturnOrder`           | `POST /v1/openapi/order/add`                         |
| **basic**      | `getCountryCodes`             | `GET  /v1/basic/country/get`                         |
|                | `getProducts`                 | `GET  /v1/basic/product/get`                         |

## Low-Level Request Access

When you need to call an endpoint that is not modeled yet, use the generic request methods:

```ts
const response = await client.request<{ items: unknown[] }>({
  method: "GET",
  path: "/v1/order/detail",
  query: {
    waybillNumber: ["YT0001", "YT0002"],
  },
});

console.log(response.data);
```

`client.request()` returns envelope data, status, headers, the raw parsed body, and the raw `Response` object. `client.invoke()` returns only `response.data`.

## Error Model

- `YunExpressError`: base error with `status`, `headers`, `body`, `code`, and `requestId`
- `AuthenticationError`: 401 or 403 responses
- `RateLimitError`: 429 responses with optional `retryAfter`
- `RequestExecutionError`: network, timeout, or local validation failures
- `UpstreamApiError`: non-auth upstream responses or business envelope failures

## CLI

The SDK ships a `yunexpress` CLI for quick terminal access to all API resources.

### Setup

```bash
npm install -g yunexpress-sdk
yunexpress --help
```

### Authentication

Auth credentials are resolved in order: CLI flags → environment variables → config file.

**Environment variables:**

```bash
export YUNEXPRESS_APP_ID=your-app-id
export YUNEXPRESS_API_KEY=your-api-key
export YUNEXPRESS_ENVIRONMENT=production   # or "sandbox"
# Optional:
export YUNEXPRESS_ACCESS_TOKEN=...
export YUNEXPRESS_SOURCE_KEY=...
export YUNEXPRESS_BASE_URL=https://custom.endpoint.com
```

**Config file** (`~/.yunexpressrc.json`):

```json
{
  "appId": "your-app-id",
  "apiKey": "your-api-key",
  "environment": "production"
}
```

**CLI flags** (override everything):

```bash
yunexpress --app-id xxx --api-key xxx --environment production basic countries
```

### Commands

```
yunexpress orders          Manage orders
yunexpress tracking        Tracking operations
yunexpress labels          Label and document operations
yunexpress pricing         Pricing operations
yunexpress exceptions      Exception handling operations
yunexpress returns         Return order operations
yunexpress billing         Billing operations
yunexpress basic           Basic data lookups
```

Use `yunexpress <command> --help` to see subcommands and options.

### Examples

```bash
# Basic data lookups
yunexpress basic countries
yunexpress basic products

# Orders
yunexpress orders create --data @payload.json
yunexpress orders create --data '{"productCode":"STANDARD","customerOrderNumber":"ORD-001",...}'
cat payload.json | yunexpress orders create --data -
yunexpress orders get --order-number YT2231431267000001
yunexpress orders get-sender --order-number YT2231431267000001
yunexpress orders last-mile-carriers --waybill-numbers YT001,YT002
yunexpress orders modify-weight --waybill-number YT001 --weight 1.5
yunexpress orders cancel --waybill-number YT2231431267000001
yunexpress orders hold --waybill-number YT001 --remark "Awaiting docs"
yunexpress orders pickup-points --country-code DE --postal-code 10115

# Labels and documents
yunexpress labels get --order-number YT2231431267000001
yunexpress labels shipping-docs --order-number YT2231431267000001
yunexpress labels pod --order-number YT2231431267000001

# Tracking
yunexpress tracking get --order-number YT2231431267000001
yunexpress tracking subscribe-waybill --waybill-numbers YT001,YT002,YT003
yunexpress tracking cancel-waybill --waybill-numbers YT001,YT002
yunexpress tracking get-waybill-sub --waybill-numbers YT001
yunexpress tracking subscribe-product --product-codes STANDARD,EXPRESS
yunexpress tracking cancel-product --product-codes STANDARD
yunexpress tracking get-product-sub --product-code STANDARD

# Pricing
yunexpress pricing trial --country-code US --weight 0.5 --weight-unit KG

# Billing
yunexpress billing detail --start-date 2024-01-01 --end-date 2024-12-31
yunexpress billing freight --waybill-number YT2231431267000001

# Exceptions
yunexpress exceptions release --waybill-number YT123 --remark "Resolved"

# Returns
yunexpress returns create --data @return-payload.json
```

### Data Input

For commands with complex payloads (`orders create`, `returns create`), use the `--data` flag:

| Format      | Example                          |
| ----------- | -------------------------------- |
| Inline JSON | `--data '{"productCode":"..."}'` |
| File        | `--data @payload.json`           |
| Stdin       | `--data -` (pipe via stdin)      |

## Agent Skill

The SDK includes a Copilot agent skill that lets AI assistants operate YunExpress shipping on your behalf. Install it with:

```bash
npx skills add https://github.com/evan-lc/yunexpress-sdk --skill yunexpress
```

Once installed, your AI agent can create orders, track shipments, print labels, and more — just describe what you need in plain language.

## Known Limitations

- Sandbox token acquisition is account-specific. Production auto-exchange is built in, but sandbox integrations may still need an explicit `accessToken` or `tokenProvider`.
- Some response field schemas are intentionally loose until more official documentation is available.
