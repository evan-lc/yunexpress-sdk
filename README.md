# yunexpress-sdk

TypeScript SDK skeleton for the YunExpress OpenAPI. The current version focuses on a stable Node 18+ client foundation: environment switching, auth abstraction, request transport, response envelope parsing, error modeling, and the first confirmed business APIs `orders.createPackage` for `POST /v1/order/package/create` plus `orders.getWaybillDetail` for `GET /v1/order/info/get`.

## Current Scope

- Node 18+ runtime with `fetch`
- ESM + CJS package output with type declarations
- Sandbox and production auth models
- Built-in production OAuth token exchange and HMAC signing
- Replaceable signer and token provider hooks
- Retry-aware HTTP transport with raw response passthrough
- Unified error hierarchy for auth, request, rate limit, and upstream failures
- First concrete resource methods: `orders.createPackage`, `orders.getWaybillDetail`
- Placeholder resource namespaces for `labels`, `tracking`, `pricing`, `catalog`, `compliance`, `exceptions`, `apiSeries`, `b2b`, and `returns`

## Install And Develop

```bash
vp install
vp test
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

The order query dictionary page for `interfaceId=1659006512874094594` documents `GET /v1/order/info/get` with a single required query parameter `order_number`. The SDK exposes this as a typed method:

```ts
const detail = await client.orders.getWaybillDetail({
  orderNumber: "YT2231431267000001",
});

console.log(detail.data.waybill_number);
console.log(detail.data.receiver?.country_code);
```

The input is normalized to the documented query parameter `order_number`. The response currently preserves the documented wire keys such as `waybill_number`, `customer_order_number`, `packages`, `receiver`, `sender`, and `declaration_info`.

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

## Known Limitations

- Sandbox token acquisition is still account-specific. Production auto-exchange is built in, but sandbox integrations may still need explicit `accessToken` or `tokenProvider`.
- Only `orders.createPackage` and `orders.getWaybillDetail` are modeled as concrete business methods. Other resource groups are exposed as extension points, not final method contracts.
- Most response field schemas are intentionally loose until more official detail pages or integration captures are available.
