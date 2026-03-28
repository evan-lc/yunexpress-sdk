# yunexpress-sdk

TypeScript SDK skeleton for the YunExpress OpenAPI. The current version focuses on a stable Node 18+ client foundation: environment switching, auth abstraction, request transport, response envelope parsing, error modeling, and the first confirmed business API `orders.createPackage` for `POST /v1/order/package/create`.

## Current Scope

- Node 18+ runtime with `fetch`
- ESM + CJS package output with type declarations
- Sandbox and production auth models
- Replaceable signer and token provider hooks
- Retry-aware HTTP transport with raw response passthrough
- Unified error hierarchy for auth, request, rate limit, and upstream failures
- First concrete resource method: `orders.createPackage`
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

- Sandbox: `https://sandbox-openapi.yunexpress.com`
- Production: `https://openapi.yunexpress.com`

If your account uses different endpoints, override `baseUrl` explicitly.

Both built-in auth providers emit the confirmed request headers `token`, `date`, and `sign`. The signer and token retrieval details are still not fully documented, so the SDK keeps both parts extensible:

- `accessToken`: use a token that your own system already obtained
- `tokenProvider`: defer token lookup or refresh to your own async function
- `signer`: inject the real signing logic once the official rule is available

Production auth additionally models the confirmed `appId` and `apiKey` inputs, while sandbox auth exposes `sourceKey` and `uatAccessKey` for future token/signature flows.

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

- The real signature algorithm is still unknown. The default signer intentionally emits an empty `sign` value until you inject a real implementation.
- The official token acquisition flow is still incomplete. Use `accessToken` or your own `tokenProvider` for now.
- Only `orders.createPackage` is modeled as a concrete business method. Other resource groups are exposed as extension points, not final method contracts.
- Most response field schemas are intentionally loose until more official detail pages or integration captures are available.
