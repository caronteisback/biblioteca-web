# Changelog

All notable changes are listed here. The format follows [Keep a Changelog](https://keepachangelog.com/).

## [0.3.0] - 2026-10-21

A new look; no screen changes what it does and the API and the contract are untouched.

### Added

- **Side menu.** The menu moves from the top to a column on the left, with an icon per screen. On a phone it folds away behind a menu button and closes by itself when a screen is chosen (or with Escape).
- **The side menu folds to its icons on a wide screen** (a button next to it) and the choice is remembered in the browser; each icon keeps its name for screen readers and as a tooltip. On a phone the menu slides in as before.
- **User menu** at the top right: the person's name and role, a switch between the light and the dark theme, and "Salir". It closes with Escape, with a click elsewhere, with Tab and when the screen changes.
- **Light and dark theme.** The panel starts light; the choice is kept in the browser (`localStorage`) and applied before the first screen is drawn. The colours are variables in one place (`index.css`).
- **One set of status colours**, the `Estado` component: green is fine (active, available, paid), amber needs attention (lent out), red is a problem (overdue, pending fine) and gray is inactive (returned, deactivated, retired). Every status carries an icon and its words as well, so colour is never the only clue.
- `contraste.test.ts` checks every pair of colours of both themes (4.5:1 for text, 3:1 for a field's border), since axe cannot judge colour in jsdom. It found a green that fell short (4.36:1) before it reached anyone.

### Changed

- The pages sit on a card over a pale background instead of directly on the page.
- "Salir" moved into the user menu; the tests sign out through it.
- Tests: 192 (from 144). The long whole-journey tests got a 20 s limit: with every test file running at once they could pass the default 5 s.
- **Tables become cards on a phone** (up to 640 px): each row is a card with the column name in front of every value, so no column such as "Estado" hides behind a sideways scroll. The table roles are explicit in the markup, since some screen readers stop treating a table as one when it is not drawn as a table, and the generated labels are marked decorative so they are not read twice. `tablas.test.tsx` keeps labels, roles and headers in step.
- Small screens: titles with an action, inline forms and the member sheet wrap instead of overflowing; the sheet stacks its labels over their values. Checked in a real browser on every screen at 390 and 768 px (no horizontal scroll outside the tables, which scroll inside their own box; axe finds nothing).

### Fixed

- On a phone the user menu button had no accessible name once its text was hidden with `display: none`; it is now hidden visually and stays announced. Found by running axe in a real browser, which the jsdom tests cannot do because they do not load the styles.
- The actions column of the fines table had its cell borders out of line.

## [0.2.2] - 2026-10-21

### Fixed

- The proxy check of CI (`scripts/probar-proxy.sh`) judged the first answer it got, which on a slow runner was nginx's 502 while the fake API was still starting. It now waits for a real answer.
- After signing out on purpose, the next person to sign in landed on the screen the previous one was on (for example `/libros`) instead of their own home, because the protected route remembered that screen when the session ended. A sign-out on purpose now leaves nothing to go back to. Found by signing out and in again as another user against the real API.

## [0.2.1] - 2026-10-21

### Fixed

- **Every POST, PUT and DELETE through the nginx image was refused with 403** (signing in included). A browser sends `Origin: http://localhost:8081` with them, but nginx forwarded `Host: localhost` without the port, so the API took the request for one from another site. nginx now forwards the Host as received (`$http_host`). Reads (GET) carry no `Origin`, which is why the lists worked and the bug went unseen.
- `scripts/probar-proxy.sh` reproduces it: it starts the image in front of a fake API that echoes the Host it receives, and fails if the port is missing. CI runs it.

## [0.2.0] - 2026-10-21

**Breaking:** the panel needs the API 0.3.0 (contract v0.2.1): every operation now asks for a token.

### Added

- **Sign-in.** A login screen; the token is kept in the `sessionStorage` of the tab and sent as `Authorization: Bearer` by the typed client, which never sends it to the sign-in itself. A 401 on any other call ends the session and returns to the sign-in with a notice; an expired token ends it by itself.
- **Two roles.** Librarians see the whole panel; members see the catalog to read and **Mi cuenta** (their data, score, alerts, active loans and pending fines). Screens a role cannot use show "Sin permiso" and are not offered in the menu; after signing in you return to the screen you asked for only if your role can see it.
- **Read-only catalog for members:** no create, edit, delete, lend or retire controls.
- **Messages in Spanish** for the new error codes (`UNAUTHENTICATED`, `INVALID_CREDENTIALS`, `FORBIDDEN`, `TOO_MANY_ATTEMPTS`); the build fails if the contract adds a code without one.
- A "Salir" button and the signed-in email in the header.

### Tests

- 143 in total (144 from 0.2.2). New: the session store (storage that is broken, expired or malformed, the timer, the subscriptions), the client middleware (token sent, never to the sign-in, 401 ends the session, 403 does not), the sign-in screen, access by role for every route, "Mi cuenta", the read-only catalog, and a journey for a member. The whole-journey test now starts at the sign-in. axe finds no violations on the new screens, which were also checked in a real browser against the real API.

## [0.1.1] - 2026-10-21

### Added

- **Container image:** a multi-stage `Dockerfile` (Node builds, nginx without root serves) with a health check, and an nginx config that forwards `/api` to the API, falls back to the panel for every other address and sends security headers (Content-Security-Policy, `X-Frame-Options`, `nosniff`). CI builds the image on every push.

## [0.1.0] - 2026-10-21

First complete version of the librarian's panel: catalog, members, loans and fines, written against the API contract v0.1.1.

### Added

- **A whole-journey test:** the real application walked over an in-memory library, from a new book to the payment of a fine.
- **Accessibility:** axe finds no violations on any screen (also checked for colour contrast in light and dark mode in a real browser); a skip link, focus moved to the content when the screen changes, a tab title for each screen, and a notice when a screen fails while drawing.
- **Small screens:** the navigation wraps; no screen scrolls sideways at 375 px.

- **Loans:** paginated list filtered by state and member; a new-loan screen with a member picker and a picker of available copies (it can open already filled from a member or from a copy); the loan detail with the member and the copy by name, renew, return (asking for confirmation) and the fine a late return creates.
- **Fines:** paginated list filtered by state and member, and payment of a pending fine.
- **Member screen:** its active loans and pending fines, and a button to lend.
- **Navigation:** Loans and Fines in the bar; "Prestar" on every available copy of a book.

- **Catalog:** paginated list of books with search (kept in the address), create, edit and delete; each book shows its copies, with commands to add, retire, restore and delete them and the state of each one.
- **Members:** paginated list with search, create, edit, deactivate, reactivate and delete; the detail shows the score and the alerts calculated by the API, each with a Spanish text (the build fails if the contract adds an alert code without one).
- **Navigation:** routes with React Router, a navigation bar, and a "not found" screen for bad addresses.
- **Tests:** 69 in total: units, screens against a fake API, a whole journey over an in-memory library, and an accessibility check of every screen with axe.

- **API client generated from the contract:** a pinned copy of biblioteca-contrato v0.1.1, TypeScript types generated from it (`npm run api:generate`) and a typed client built on openapi-fetch. `npm run api:check` runs in CI and fails if the copy or the types drift.
- **Errors:** every failed call, network failures included, becomes an `ApiError`; each of the 30 error codes of the contract has a Spanish message, and the build fails if the contract adds a code without one.
- **Tests:** unit tests with Vitest, run in CI.

- Project skeleton: React 19, TypeScript and Vite, linted with oxlint.
- A first page that reads the catalog of the library API and says whether it is connected.
- Continuous integration on GitHub Actions: lint and build on every push.
