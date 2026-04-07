# Pitney Bowes Library Modernization

**Date**: 2026-04-07
**Version**: 1.0.0 (breaking)
**Branch**: `remove-usps-fallback`

## Summary

Rewrite the `pitney-bowes` library to match the patterns established by the `usps` library: native `fetch`, `async/await`, `@stores.com/http-error`, `node:test`, minimal dependencies.

This is a breaking change. All methods switch from callbacks to async/await. The version bumps to 1.0.0.

## Current State

- **HTTP client**: `request` (deprecated, last publish 2020)
- **Async pattern**: Callbacks only
- **Error handling**: `http-errors` package
- **Tests**: Mocha + nyc + nock
- **Production deps**: `http-errors`, `memory-cache`, `request`
- **Dev deps**: `@eslint/js`, `coveralls`, `eslint`, `globals`, `mocha`, `nock`, `nyc`

## Target State

- **HTTP client**: Native `fetch` with `AbortSignal.timeout()`
- **Async pattern**: Pure `async/await`
- **Error handling**: `@stores.com/http-error`
- **Tests**: `node:test` + nock (only where sandbox is broken)
- **Production deps**: `@stores.com/http-error`, `memory-cache`
- **Dev deps**: `@eslint/js`, `eslint`, `globals`, `nock`

## Module Design

### Constructor

```js
const cache = require('memory-cache');
const HttpError = require('@stores.com/http-error');

function PitneyBowes(args) {
    const options = {
        baseUrl: 'https://shipping-api-sandbox.pitneybowes.com/shippingservices',
        baseTestUrl: 'https://api-test.pitneybowes.com',
        ...args
    };

    // Methods attached to `this` as async arrow functions
}

module.exports = PitneyBowes;
```

### Methods

All methods are `async` arrow functions on `this`. All accept an optional `_options` parameter with `timeout` support (default 30000ms).

#### getOAuthToken(_options)

- Fetches OAuth token from `${baseUrl.replace('/shippingservices', '')}/oauth/token`
- Caches token using `memory-cache` with key `pitneybowes:oauth:${options.api_key}`
- TTL is `expiresIn * 1000 / 2` (half the token lifetime)
- Uses Basic auth with base64-encoded `api_key:api_secret`
- Body: `new URLSearchParams({ grant_type: 'client_credentials' })`
- Content-Type: `application/x-www-form-urlencoded`
- Internal callers call `await this.getOAuthToken()` with no options (matching USPS pattern — no timeout propagation to token fetch)

#### createShipment(shipment, _options = {})

- Signature: `async (shipment, _options = {}) =>`
- Calls `await this.getOAuthToken(_options)` for Bearer token
- Headers: `Authorization: Bearer ${token.access_token}`, `Content-Type: application/json`
- POST to `${baseUrl}/v1/shipments`
- Body: `JSON.stringify(shipment)`
- Optional headers from `_options`: `X-PB-Integrator-CarrierId`, `X-PB-ShipmentGroupId`, `X-PB-TransactionId`
- Expects 201 response (note: `fetch` + `res.ok` checks for 200-299, so 201 is ok)

#### createManifest(manifest, _options = {})

- Signature: `async (manifest, _options = {}) =>`
- Calls `await this.getOAuthToken(_options)` for Bearer token
- Headers: `Authorization: Bearer ${token.access_token}`, `Content-Type: application/json`
- POST to `${baseUrl}/v1/manifests`
- Body: `JSON.stringify(manifest)`
- Optional header from `_options`: `X-PB-TransactionId`
- Expects 201 response

#### rate(shipment, _options = {})

- Signature: `async (shipment, _options = {}) =>`
- Calls `await this.getOAuthToken(_options)` for Bearer token
- Headers: `Authorization: Bearer ${token.access_token}`, `Content-Type: application/json`
- POST to `${baseUrl}/v1/rates`
- Body: `JSON.stringify(shipment)`
- Expects 200 response

#### tracking(args, _options = {})

- Signature: `async (args, _options = {}) =>`
- Calls `await this.getOAuthToken(_options)` for Bearer token
- Headers: `Authorization: Bearer ${token.access_token}`
- GET to `${baseUrl}/v1/tracking/${args.trackingNumber}?packageIdentifierType=TrackingNumber&carrier=${args.carrier}`
- `carrier` is required (no default)
- Expects 200 response

#### tlsTest(_options = {})

- Signature: `async (_options = {}) =>`
- No authentication required
- GET to `${options.baseTestUrl}/tlstest`
- Returns response as text (not JSON) via `res.text()`
- Expects 200 response

#### validateAddress(args, _options = {})

- Signature: `async (args, _options = {}) =>`
- Calls `await this.getOAuthToken(_options)` for Bearer token
- Headers: `Authorization: Bearer ${token.access_token}`, `Content-Type: application/json`
- POST to `${baseUrl}/v1/addresses/verify?minimalAddressValidation=${args.minimalAddressValidation || false}`
- Body: `JSON.stringify(args.address)`
- Expects 200 response

### Error Handling

All methods use the same pattern:

```js
if (!res.ok) {
    throw await HttpError.from(res);
}
```

This replaces the current `createError(res.statusCode, body)` pattern. `HttpError.from()` captures the response status, statusText, and body (as both text and parsed JSON when possible).

For network errors (invalid URLs, DNS failures, timeouts), the native `fetch` throws `TypeError` or `AbortError` directly — no wrapping needed.

### Timeout Support

All fetch calls include `AbortSignal.timeout(_options.timeout || 30000)`. This matches the USPS library pattern.

## Test Design

### Framework

Migrate from Mocha to `node:test`. Test file stays at `test/index.js`.

### Structure

Top-level `test()` blocks per method, with `t.test()` for individual cases:

```js
const test = require('node:test');
const assert = require('node:assert');
const cache = require('memory-cache');
const nock = require('nock');
const PitneyBowes = require('../index');

test('PitneyBowes.methodName', { concurrency: true }, async (t) => {
    t.beforeEach(() => cache.clear());
    await t.test('should ...', async () => { ... });
});
```

### Cache Key for "Invalid baseUrl with Token" Tests

The "invalid baseUrl (with token)" tests pre-populate the cache to skip the OAuth call. With the new key format, seed using:

```js
cache.put(`pitneybowes:oauth:${process.env.API_KEY}`, token, token.expiresIn * 1000 / 2);
```

Then create a new instance with `baseUrl: 'invalid'` — the cached token is keyed by `api_key`, not URL, so it will be found regardless of `baseUrl`.

### createManifest Valid Response Payload

Uses USPS carrier with PB Expedited (SCAN Form):

```js
const manifest = {
    carrier: 'USPS',
    submissionDate: new Date().toISOString().split('T')[0],
    parameters: [
        { name: 'SHIPPER_ID', value: '9015544760' }
    ]
};
```

### Nock Mocks

**Tracking success** — mock both OAuth token and tracking GET:

```js
nock('https://shipping-api-sandbox.pitneybowes.com')
    .post('/oauth/token').reply(200, { access_token: 'mock', expiresIn: 36000 });
nock('https://shipping-api-sandbox.pitneybowes.com/shippingservices')
    .get('/v1/tracking/9234690390809100255164')
    .query({ packageIdentifierType: 'TrackingNumber', carrier: 'USPS' })
    .reply(200, { trackingNumber: '9234690390809100255164', status: 'Delivered', carrier: 'USPS' });
```

**TLS test success** — mock the GET to baseTestUrl:

```js
nock('https://api-test.pitneybowes.com')
    .get('/tlstest')
    .reply(200, 'TLS_Connection_Success');
```

Both mocked tests must call `nock.cleanAll()` in `t.after()` to avoid intercepting subsequent tests.

### Live vs Mock Tests

| Method | Test | Live / Mock | Reason |
|--------|------|------------|--------|
| getOAuthToken | invalid baseUrl | Live | Tests TypeError from fetch |
| getOAuthToken | non-200 status | Live | httpbin.org returns 500 |
| getOAuthToken | valid token | Live | Sandbox works |
| getOAuthToken | cached token | Live | Sandbox works |
| createShipment | invalid baseUrl (no token) | Live | Tests TypeError from fetch |
| createShipment | invalid baseUrl (with token) | Live | Tests TypeError from fetch |
| createShipment | non-200 status | Live | httpbin.org returns 500 |
| createShipment | no shipment specified | Live | Sandbox returns error |
| createShipment | valid response | Live | Sandbox works |
| createManifest | invalid baseUrl (no token) | Live | Tests TypeError from fetch |
| createManifest | invalid baseUrl (with token) | Live | Tests TypeError from fetch |
| createManifest | non-200 status | Live | httpbin.org returns 500 |
| createManifest | no manifest specified | Live | Sandbox returns error |
| createManifest | valid response | Live | USPS carrier |
| rate | invalid baseUrl (no token) | Live | Tests TypeError from fetch |
| rate | invalid baseUrl (with token) | Live | Tests TypeError from fetch |
| rate | non-200 status | Live | httpbin.org returns 500 |
| rate | no shipment specified | Live | Sandbox returns error |
| rate | valid response | Live | Sandbox works |
| tracking | invalid baseUrl (no token) | Live | Tests TypeError from fetch |
| tracking | invalid baseUrl (with token) | Live | Tests TypeError from fetch |
| tracking | non-200 status | Live | httpbin.org returns 500 |
| tracking | no tracking number | Live | Sandbox returns error |
| tracking | valid response | **Mock** | Sandbox returns Bad Request for test tracking numbers |
| tlsTest | invalid baseTestUrl | Live | Tests TypeError from fetch |
| tlsTest | non-200 status | Live | httpbin.org returns 500 |
| tlsTest | success | **Mock** | PB cert mismatch on api-test.pitneybowes.com |
| validateAddress | invalid baseUrl (no token) | Live | Tests TypeError from fetch |
| validateAddress | invalid baseUrl (with token) | Live | Tests TypeError from fetch |
| validateAddress | non-200 status | Live | httpbin.org returns 500 |
| validateAddress | no address specified | Live | Sandbox returns error |
| validateAddress | valid response | Live | Sandbox works |

### Error Assertion Pattern

For async errors, use `assert.rejects`:

```js
await assert.rejects(pb.someMethod(), (err) => {
    assert(err instanceof TypeError);
    return true;
});
```

For HttpError responses:

```js
await assert.rejects(pb.someMethod(), (err) => {
    assert(err instanceof HttpError);
    assert.strictEqual(err.message, '400 Bad Request');
    return true;
});
```

### Nock Cleanup

Mocked tests call `nock.cleanAll()` in a `t.after()` hook or at the end of the test to avoid intercepting subsequent tests.

## Package Changes

### package.json

```json
{
  "name": "pitney-bowes",
  "dependencies": {
    "@stores.com/http-error": "~1.0.0",
    "memory-cache": "~0.2.0"
  },
  "devDependencies": {
    "@eslint/js": "*",
    "eslint": "*",
    "globals": "*",
    "nock": "*"
  },
  "license": "MIT",
  "repository": {
    "type": "git",
    "url": "git+https://github.com/stores-com/pitney-bowes.git"
  },
  "scripts": {
    "test": "node --test --test-force-exit --test-reporter=spec",
    "test:only": "node --test --test-force-exit --test-only --test-reporter=spec",
    "coveralls": "node --test --test-force-exit --experimental-test-coverage --test-reporter=spec --test-reporter-destination=stdout --test-reporter=lcov --test-reporter-destination=lcov.info && coveralls < lcov.info"
  },
  "version": "1.0.0"
}
```

**Removed deps**: `http-errors`, `request`
**Removed devDeps**: `coveralls`, `mocha`, `nyc`
**Added deps**: `@stores.com/http-error`

### Nock Version

`nock` v14+ is required for native `fetch` interception (uses `@mswjs/interceptors` under the hood). Ensure the installed version supports this.

### ESLint Config

Update `eslint.config.js` to remove Mocha globals, keep Node globals only. Match the USPS config (no explicit `ecmaVersion` or `sourceType`):

```js
const globals = require('globals');
const js = require('@eslint/js');

module.exports = [
    js.configs.recommended,
    {
        languageOptions: {
            globals: { ...globals.node }
        },
        rules: { /* copy rules from USPS eslint.config.js verbatim */ }
    }
];
```

Note: the current branch config has `...globals.mocha` — remove it. Copy the USPS rules exactly (including `no-console: 'error'`, `space-before-function-paren`, etc.). `eslint` itself stays in devDependencies (used by CI via `npx eslint .`).

### LICENSE

Change from Apache 2.0 to MIT to match USPS. Update `package.json` `"license"` field from `"Apache-2.0"` to `"MIT"`.

### GitHub Workflows

Replace `.github/workflows/continuousIntegration.yaml` with two workflows matching the USPS pattern:

**`.github/workflows/test.yml`** — runs on push, pull_request, workflow_dispatch:
- Single job (no matrix — remove MongoDB/Redis versions)
- `NODE_VERSION: 24.11.0` as env var
- Steps: setup-node → checkout → npm install → lint → test with coverage → Coveralls upload → Slack notification
- Test command: `node --test --test-force-exit --experimental-test-coverage --test-reporter=spec --test-reporter-destination=stdout --test-reporter=lcov --test-reporter-destination=lcov.info`
- Coveralls via `coverallsapp/github-action@v2` (replaces `coveralls` npm package)
- Env vars for test step: `API_KEY`, `API_SECRET` from secrets

**`.github/workflows/publish.yml`** — runs on repository_dispatch, workflow_dispatch:
- Verifies tests passed on main before publishing
- `npm publish --provenance`
- Creates GitHub release with auto-generated notes

## Migration Impact

### Breaking Changes

1. All methods now return Promises instead of accepting callbacks
2. Errors are thrown (as `HttpError` or `TypeError`) instead of passed to callbacks
3. All methods that previously took `(data, options, callback)` now take `(data, _options = {})` — the callback parameter is removed, the second param becomes an options object (timeout, headers). `tracking(args, callback)` becomes `tracking(args, _options = {})`
4. Error objects change from `http-errors` shape (`err.status`, `err.message`) to `HttpError` shape (`err.message = '${status} ${statusText}'`, `err.json`, `err.text`)
5. OAuth token cache key changes from URL-based (`${baseUrl}/oauth/token`) to key-based (`pitneybowes:oauth:${api_key}`) — callers who interact with the cache directly (e.g., tests) must update
6. `getOAuthToken()` now accepts an optional `_options` parameter (non-breaking for callers, but the signature changed)

### Callers to Update

- `fulfillment-service` — primary consumer, needs to switch from callbacks to async/await
- Any other internal service using this library

## CHANGELOG

```
## [1.0.0] - 2026-04-07
### Changed
- **BREAKING**: All methods now return Promises instead of accepting callbacks
- **BREAKING**: Errors are now `HttpError` instances (from `@stores.com/http-error`) instead of `http-errors` instances
- Replaced `request` with native `fetch`
- Added timeout support via `AbortSignal.timeout()` (default 30s)
- Migrated tests from Mocha to `node:test`
- Migrated coverage from `nyc` to `node --experimental-test-coverage`

### Removed
- Removed `request` dependency (deprecated)
- Removed `http-errors` dependency
- Removed Mocha, nyc, coveralls dev dependencies
```
