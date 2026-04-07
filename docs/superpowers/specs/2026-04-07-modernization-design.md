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
- **Dev deps**: `@eslint/js`, `globals`, `nock`

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
- Content-Type: `application/x-www-form-urlencoded` with `grant_type=client_credentials`

#### createShipment(shipment, _options)

- POST to `${baseUrl}/v1/shipments`
- Body: JSON shipment object
- Optional headers from `_options`: `X-PB-Integrator-CarrierId`, `X-PB-ShipmentGroupId`, `X-PB-TransactionId`
- Expects 201 response (note: `fetch` + `res.ok` checks for 200-299, so 201 is ok)

#### createManifest(manifest, _options)

- POST to `${baseUrl}/v1/manifests`
- Body: JSON manifest object
- Optional header from `_options`: `X-PB-TransactionId`
- Expects 201 response

#### rate(shipment, _options)

- POST to `${baseUrl}/v1/rates`
- Body: JSON shipment object
- Expects 200 response

#### tracking(args, _options)

- GET to `${baseUrl}/v1/tracking/${args.trackingNumber}?packageIdentifierType=TrackingNumber&carrier=${args.carrier}`
- `carrier` is required (no default)
- Expects 200 response

#### tlsTest(_options)

- GET to `${baseTestUrl}/tlstest`
- No authentication required
- Returns response as text (not JSON)
- Expects 200 response

#### validateAddress(args, _options)

- POST to `${baseUrl}/v1/addresses/verify?minimalAddressValidation=${args.minimalAddressValidation || false}`
- Body: JSON address object (`args.address`)
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
  "dependencies": {
    "@stores.com/http-error": "~1.0.0",
    "memory-cache": "~0.2.0"
  },
  "devDependencies": {
    "@eslint/js": "*",
    "globals": "*",
    "nock": "*"
  },
  "scripts": {
    "test": "node --test --test-force-exit --test-reporter=spec",
    "test:only": "node --test --test-force-exit --test-only --test-reporter=spec",
    "coveralls": "node --test --test-force-exit --experimental-test-coverage --test-reporter=spec --test-reporter=lcov --test-reporter-destination=lcov.info && coveralls < lcov.info"
  },
  "version": "1.0.0"
}
```

**Removed deps**: `http-errors`, `request`
**Removed devDeps**: `coveralls`, `mocha`, `nyc`
**Added deps**: `@stores.com/http-error`

### ESLint Config

Update `eslint.config.js` to remove Mocha globals, keep Node globals only:

```js
const globals = require('globals');
const js = require('@eslint/js');

module.exports = [
    js.configs.recommended,
    {
        languageOptions: {
            ecmaVersion: 2022,
            globals: { ...globals.node }
        },
        rules: { /* match USPS config */ }
    }
];
```

### CI Workflow

Update `.github/workflows/continuousIntegration.yaml`:

- Remove MongoDB and Redis services (not used by this library)
- Update test command to: `node --test --test-force-exit --experimental-test-coverage --test-reporter=spec --test-reporter=lcov --test-reporter-destination=lcov.info`
- Keep Coveralls upload step
- Keep Slack notification step

## Migration Impact

### Breaking Changes

1. All methods now return Promises instead of accepting callbacks
2. Errors are thrown (as `HttpError` or `TypeError`) instead of passed to callbacks
3. `tracking()` signature unchanged but `carrier` was already required (USPS fallback removed in previous commit)
4. Error objects change from `http-errors` shape (`err.status`, `err.message`) to `HttpError` shape (`err.message = '${status} ${statusText}'`, `err.json`, `err.text`)

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
