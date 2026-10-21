# biblioteca-web

[![CI](https://github.com/caronteisback/biblioteca-web/actions/workflows/ci.yml/badge.svg)](https://github.com/caronteisback/biblioteca-web/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
![React 19](https://img.shields.io/badge/React-19-61DAFB)
![TypeScript](https://img.shields.io/badge/TypeScript-6-3178C6)
![Vite 8](https://img.shields.io/badge/Vite-8-9135FF)

Browser frontend of the library system: the librarian's panel for the catalog, members, loans and fines. It talks to [biblioteca-java](https://github.com/caronteisback/biblioteca-java) and is written against the shared [API contract](https://github.com/caronteisback/biblioteca-contrato).

> All data in this project is fictional. It is a portfolio project and is not related to any real organization.

## Status

Early: the skeleton is in place and the first page proves that the browser can reach the API. The screens come next.

| Step | What | State |
|------|------|-------|
| 1 | Project skeleton, CORS, CI | done |
| 2 | API client with types generated from the contract | done |
| 3 | Catalog and members | next |
| 4 | Loans and fines | planned |
| 5 | Tests and polish | planned |

There is no login yet: the API has no authentication, so this panel is for local use only and must not be exposed to a network.

## Quick start

You need Node.js 24 and the API running (see the [biblioteca-java README](https://github.com/caronteisback/biblioteca-java#quick-start)).

```bash
npm install
npm run dev
```

Open <http://localhost:5173>. If the API is up you will see "API conectada" and the number of books in the catalog; if not, the page says which address it tried.

The API address is `http://localhost:8080` by default. To change it, copy `.env.example` to `.env.local` and edit `VITE_API_URL`.

## Scripts

| Command | What it does |
|---------|--------------|
| `npm run dev` | Development server with hot reload on port 5173 |
| `npm run build` | Type-checks and builds the production files into `dist/` |
| `npm run lint` | Lints the code with oxlint |
| `npm test` | Runs the unit tests with Vitest |
| `npm run api:generate` | Regenerates `src/api/schema.d.ts` from the contract copy |
| `npm run api:check` | Checks the contract copy and that the generated types are up to date |
| `npm run preview` | Serves the production build locally |

## The API client and the contract

The frontend does not describe the API by hand. `contract/openapi.yaml` is a pinned copy of a tagged version of [biblioteca-contrato](https://github.com/caronteisback/biblioteca-contrato) (the tag and a SHA-256 are in `contract/contract.properties`), and the TypeScript types in `src/api/schema.d.ts` are generated from it with [openapi-typescript](https://openapi-ts.dev). The calls go through [openapi-fetch](https://openapi-ts.dev/openapi-fetch/), which checks them against those types:

- a path, a parameter or a body that the contract does not describe **does not compile**;
- `MENSAJES` in `src/api/errores.ts` has to give a Spanish message for **every error code of the contract**: if the contract adds one, the build fails until it is handled;
- a failed call always arrives as an `ApiError` (with the code, the status and the server's English text), including a network failure, so a screen has one kind of failure to deal with.

To adopt a new version of the contract:

```bash
# 1. copy its openapi.yaml into contract/ and update the three lines of contract/contract.properties
npm run api:generate   # 2. regenerate the types
npm run build          # 3. the compiler lists what the new version breaks
```

`npm run api:check` (also run by CI) fails if the contract copy was edited by hand or the types are stale.

## How it reaches the API

The browser only lets a page call another origin if that server allows it (CORS). The API keeps an explicit list of allowed origins and `http://localhost:5173` is in its defaults. To serve this app from another address, add it to `BIBLIOTECA_CORS_ORIGENES_PERMITIDOS` in the API.

CORS covers `/api/**` only, so the frontend calls nothing else.

## Project layout

```
contract/     pinned copy of the API contract and its tag
scripts/      api.mjs: generates and checks the types
src/
  api/        schema.d.ts (generated), cliente.ts (typed client), errores.ts (codes and messages)
  main.tsx    entry point
  App.tsx     the first page
  config.ts   API address from VITE_API_URL
```

## License

[MIT](LICENSE).
