# Changelog

All notable changes are listed here. The format follows [Keep a Changelog](https://keepachangelog.com/).

## [Unreleased]

### Added

- **API client generated from the contract:** a pinned copy of biblioteca-contrato v0.1.1, TypeScript types generated from it (`npm run api:generate`) and a typed client built on openapi-fetch. `npm run api:check` runs in CI and fails if the copy or the types drift.
- **Errors:** every failed call, network failures included, becomes an `ApiError`; each of the 30 error codes of the contract has a Spanish message, and the build fails if the contract adds a code without one.
- **Tests:** 8 unit tests with Vitest, run in CI.

- Project skeleton: React 19, TypeScript and Vite, linted with oxlint.
- A first page that reads the catalog of the library API and says whether it is connected.
- Continuous integration on GitHub Actions: lint and build on every push.
