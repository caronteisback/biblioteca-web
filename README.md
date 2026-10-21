# biblioteca-web

[![CI](https://github.com/caronteisback/biblioteca-web/actions/workflows/ci.yml/badge.svg)](https://github.com/caronteisback/biblioteca-web/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
![React 19](https://img.shields.io/badge/React-19-61DAFB)
![TypeScript](https://img.shields.io/badge/TypeScript-6-3178C6)
![Vite 8](https://img.shields.io/badge/Vite-8-9135FF)

Browser frontend of the library system: the librarian's panel for the catalog, members, loans and fines. It talks to [biblioteca-java](https://github.com/caronteisback/biblioteca-java) and is written against the shared [API contract](https://github.com/caronteisback/biblioteca-contrato).

> All data in this project is fictional. It is a portfolio project and is not related to any real organization.

## Status

Working: the catalog (books and their copies), the members, the loans and the fines: the whole life of a loan from the browser. Left: the login, once the API has one.

| Step | What | State |
|------|------|-------|
| 1 | Project skeleton, CORS, CI | done |
| 2 | API client with types generated from the contract | done |
| 3 | Catalog and members | done |
| 4 | Loans and fines | done |
| 5 | Tests and polish | done |

There is no login yet: the API has no authentication, so this panel is for local use only and must not be exposed to a network.

## Quick start

You need Node.js 24 and the API running (see the [biblioteca-java README](https://github.com/caronteisback/biblioteca-java#quick-start)).

```bash
npm install
npm run dev
```

Open <http://localhost:5173>. If the API is down, the lists say so and offer a retry.

The API address is `http://localhost:8080` by default. To change it, copy `.env.example` to `.env.local` and edit `VITE_API_URL`.

## Run in a container

The image builds the panel and serves it with nginx (as a user without privileges). nginx also forwards `/api` to the API, so the browser talks to a single address and no CORS is needed. The API is expected at `http://api:8080` on the container's network.

```bash
docker build -t biblioteca-web .
```

The [biblioteca](https://github.com/caronteisback/biblioteca) repository starts the panel, the API and the database together in one command, with demo data. The page is sent with a strict Content-Security-Policy (only its own files), `X-Frame-Options: DENY`, `nosniff` and no referrer.

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

## How it is tested

```bash
npm test
```

69 tests, in four layers:

| Layer | What it proves |
|-------|----------------|
| Units | The error and alert messages, the formatting, the API client against a fake network |
| Screens | Each screen against a fake API: what it shows, what it sends, and the Spanish message for each refusal |
| Whole journey | `recorrido.test.tsx` walks the **real application** (router, screens, client) over a small in-memory library: register a book, a copy and a member, lend, see a late renewal refused, return late and get fined, be refused a new loan, pay the fine |
| Accessibility | [axe](https://github.com/dequelabs/axe-core) on every screen finds no violations; page language, tab titles, the skip link, the focus move on navigation and the error notice are checked on their own |

What these tests do **not** do: talk to the real API. The in-memory library follows the rules a screen can show, but the rules themselves are the API's and are tested there ([biblioteca-java](https://github.com/caronteisback/biblioteca-java)). The real pair was checked by hand in a browser, including the late return and the fine; automating that run against the real stack is a possible next step.

Two checks need a real browser and were done in one, not in the tests: colour contrast (axe, in light and dark mode, on every screen, no violations) and the layout at a phone width of 375 px (no horizontal scroll on any screen).

## Accessibility

- Every field has a label, every table header declares its scope, and the controls work with the keyboard.
- A "Saltar al contenido" link comes first; on each change of screen the focus moves to the content and the tab title changes, since a single-page app does not announce a new page by itself.
- Colour follows the system's light or dark mode, with contrast checked in both.
- A screen that fails while drawing shows a notice instead of a blank page.

## What you can do today

| Screen | Address | What it does |
|--------|---------|--------------|
| Books | `/libros` | Paginated list with a search on title or author; the search and the page live in the address, so reload and "back" keep them |
| New and edit book | `/libros/nuevo`, `/libros/:id/editar` | Forms; the API's answer is shown in Spanish, with the field detail when the data is invalid |
| Book | `/libros/:id` | Details, delete, and its **copies**: add, retire, restore and delete, with the state of each (available, on loan, retired) |
| Members | `/socios` | Paginated list with a search on name or email |
| New and edit member | `/socios/nuevo`, `/socios/:id/editar` | Forms |
| Member | `/socios/:id` | Details, **score** and **alerts** (calculated by the API), deactivate, reactivate and delete; its active loans and pending fines, and a button to lend |
| Loans | `/prestamos` | Paginated list, filtered by state (all, active, returned) and by member; each loan shows active, overdue (with the days) or returned |
| New loan | `/prestamos/nuevo` | Pick a member and one of the **available** copies (search, then choose); it opens already filled when it comes from a member or from a copy |
| Loan | `/prestamos/:id` | Member and copy by name, dates, renewals and alerts; **renew** and **return**; the fine that a late return created |
| Fines | `/multas` | Paginated list, filtered by state and by member; **pay** a pending fine (whole, once) |

Every screen goes through the typed client below and shows each failure with the message of its error code. The rules of lending live in the API, not here: when it refuses (a pending fine, a low score, the limit of loans, a loan that is overdue and cannot be renewed...) the screen only explains why, in Spanish.

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
  api/          schema.d.ts (generated), cliente.ts (typed client), errores.ts and alertas.ts (codes and messages), contexto.ts
  componentes/  pieces shared by the screens: layout, search box, pagination, error notice, forms, copies of a book
  hooks/        useCargar (loading state), useBusqueda (search and page in the address), useIdDeRuta
  paginas/      one file per screen
  pruebas/      test helpers (fake API, in-memory router)
  App.tsx       the routes
  config.ts     API address from VITE_API_URL
```

Screens receive the API through a React context, so tests give them a fake one and never touch the network.

## License

[MIT](LICENSE).
