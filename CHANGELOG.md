# Changelog

All notable changes are listed here. The format follows [Keep a Changelog](https://keepachangelog.com/).

## [Unreleased]

### Added

- **Catalog:** paginated list of books with search (kept in the address), create, edit and delete; each book shows its copies, with commands to add, retire, restore and delete them and the state of each one.
- **Members:** paginated list with search, create, edit, deactivate, reactivate and delete; the detail shows the score and the alerts calculated by the API, each with a Spanish text (the build fails if the contract adds an alert code without one).
- **Navigation:** routes with React Router, a navigation bar, and a "not found" screen for bad addresses.
- **Tests:** 26 in total; screens are tested against a fake API with Testing Library.

- **API client generated from the contract:** a pinned copy of biblioteca-contrato v0.1.1, TypeScript types generated from it (`npm run api:generate`) and a typed client built on openapi-fetch. `npm run api:check` runs in CI and fails if the copy or the types drift.
- **Errors:** every failed call, network failures included, becomes an `ApiError`; each of the 30 error codes of the contract has a Spanish message, and the build fails if the contract adds a code without one.
- **Tests:** unit tests with Vitest, run in CI.

- Project skeleton: React 19, TypeScript and Vite, linted with oxlint.
- A first page that reads the catalog of the library API and says whether it is connected.
- Continuous integration on GitHub Actions: lint and build on every push.
