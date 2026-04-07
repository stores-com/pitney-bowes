# Changelog
All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.0.0] - 2026-04-07
### Changed
- **BREAKING**: All methods now return Promises instead of accepting callbacks
- **BREAKING**: Errors are now `HttpError` instances (from `@stores.com/http-error`) instead of `http-errors` instances
- Replaced `request` with native `fetch`
- Added timeout support via `AbortSignal.timeout()` (default 30s)
- Migrated tests from Mocha to `node:test`
- Migrated coverage from `nyc` to `node --experimental-test-coverage`
- Changed license from Apache-2.0 to MIT

### Removed
- Removed `request` dependency (deprecated)
- Removed `http-errors` dependency
- Removed Mocha, nyc, coveralls dev dependencies

## [0.4.0] - 2026-04-06
### Changed
- Removed USPS default fallback for the `carrier` parameter in tracking requests. The caller must now explicitly provide `args.carrier`.

## [0.3.1] - 2021-08-13
### Added
- Added support for creating manifests: https://shipping.pitneybowes.com/api/post-manifests.html

## [0.3.0] - 2021-07-31
### Changed
- Changed the default base URL for the sandbox environment to match https://shipping.pitneybowes.com/overview.html#sandbox-environment
- Changed the way OAuth tokens are cached so they vary by environment.
