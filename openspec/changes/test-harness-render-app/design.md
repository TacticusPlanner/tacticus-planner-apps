# Design

## Context

See proposal.md - Why. Current state that shapes the approach:

- `apps/web/src/test/render.tsx` wraps `@testing-library/react`'s `render` with a fresh `QueryClient` and `TooltipProvider` and re-exports Testing Library; 125 test files import it, 123 import `@testing-library/react` directly, 59 wrap their own `MemoryRouter`.
- `apps/web/src/test/setup.ts` only polyfills jsdom gaps (ResizeObserver, matchMedia, pointer capture) and clears `localStorage` after each test.
- `apps/web/src/fsd/shared/config/i18n/i18n.ts` initialises the default `i18next` instance at import time with the HTTP backend and `useSuspense: true`; any test that imports the `@/shared/config` barrel pulls that in, which is why tests mock `react-i18next` and `@/shared/config` instead.
- App code touches MSAL through `useIsAuthenticated` (159 uses), `useMsal` (58) and a small instance surface: `getAllAccounts`, `getActiveAccount`, `setActiveAccount`, `acquireTokenSilent`, `ssoSilent`, `loginRedirect`, `acquireTokenRedirect`, `handleRedirectPromise`, `initialize`.
- `packages/game-catalog` and `packages/player-data` already run their own tests against `fake-indexeddb` (`src/test-setup.ts` imports `fake-indexeddb/auto`; tests reset with `Dexie.delete(<dbName>)`) and expose write functions `replaceGameCatalogDataset` and `replacePlayerDataChunk`. The web app's tests never use them; they mock `useLiveQuery` and the query modules instead.
- `@workspace/ui` exports point at `dist/`, so every web task in `turbo.json` declares `dependsOn: ["^build"]`, and the web `build*` scripts run `tsc -b` although `_build-web.yml` runs `pnpm typecheck` one step earlier.

## Goals / Non-Goals

**Goals:**

- One render entry point that can stand up the real provider stack a page needs, with each provider opt-in so the 125 existing call sites keep working unchanged.
- Tests that touch catalog or player data read it through the real storage packages, so the read path can be refactored without rewriting tests.
- Tests assert on what a user sees (role, visible English text) wherever a test is rewritten.
- `pnpm dev`, `pnpm typecheck`, `pnpm test:run` work from a clean checkout without building `packages/ui` first.

**Non-Goals:**

- Rewriting tests that do not mock the modules named in the proposal.
- Changing what the app renders, translating anything, or adding a second test runner, browser-mode tests or snapshot tests.
- Coverage thresholds, CI workflow steps, lint rules, knip configuration (owned by sibling changes).
- A mock API server (MSW or similar). TanStack Query hooks keep being exercised with `QueryClient` and mocked `fetch` as today.

## Decisions

1. **Extend `@/test/render`, do not add a parallel `renderApp`.** New optional fields on the existing options object: `route` (a path string; when present the UI is mounted as that route's element in a memory data router created with `createMemoryRouter`, so loaders, `useNavigate`, search params and `useLocation` behave as in the app), `initialEntries`, `theme` (wrap with the real `ThemeProvider` from `@/shared/theme`), and `auth` (initial signed-in state passed to the stub below). Default behaviour is byte-for-byte what the helper does today. Alternative considered: a new `renderApp` beside `render` - rejected because two entry points invite drift and the migration would touch 125 imports for no gain.
2. **Real `i18next` in every test, initialised in `setup.ts`.** The setup file creates the default instance with `resources` built by `import.meta.glob("../../public/locales/en/*.json", { eager: true })`, `lng: "en"`, `fallbackLng: "en"`, `initImmediate: false`, `react: { useSuspense: false }`, and `setup.ts` mocks `@/shared/config/i18n/i18n` to export that same instance so importing the config barrel no longer re-initialises with the HTTP backend. Existing per-file `vi.mock("react-i18next")` calls keep working (a file-level mock overrides the real module) and are deleted only when that file is rewritten anyway. Alternative: a key-echo `t` installed globally - rejected because it keeps tests asserting on keys, which is what blocks role/text queries. Alternative: lazy per-namespace loading - rejected, the eager glob costs tens of milliseconds once per worker and removes a whole class of "namespace not loaded" flakes.
3. **MSAL is replaced by a test-owned stub, installed once.** `setup.ts` calls `vi.mock("@azure/msal-react")` and `vi.mock("@azure/msal-browser")` with a stub module in `apps/web/src/test/auth.ts` that exports `setTestAuth({ authenticated, account })` plus `useIsAuthenticated`, `useMsal`, `MsalProvider` and an `instance` object implementing the nine methods app code calls, each a `vi.fn()` with a sensible default (`acquireTokenSilent` resolves a fake token, `loginRedirect` resolves). State resets after each test. Per-file MSAL mocks are removed from rewritten tests. Alternative: a real `PublicClientApplication` with a fake authority - rejected because MSAL needs `initialize()`, crypto and network configuration and would make the auth tests slower and flakier than the code they test.
4. **IndexedDB is real (`fake-indexeddb/auto` in `setup.ts`) and seeded through the packages' public write functions.** New helpers in `apps/web/src/test/seed.ts`: `seedGameCatalog(partial)` and `seedPlayerData(partial)` call `replaceGameCatalogDataset` / `replacePlayerDataChunk` per key and resolve when the writes are committed; `afterEach` deletes both databases with `Dexie.delete(catalogDbName)` / `Dexie.delete(playerDataDbName)` exactly as the package tests do. Fixture records live beside the tests that need them and are kept minimal (only fields the component reads), matching the packages' own fixture convention. Alternative: keep mocking `useLiveQuery` with a dispatcher on querier source text - rejected, it is the exact coupling the read-layer change will break. Alternative: a shared mega-fixture of the full catalog - rejected, it is slow to load and hides which fields a test depends on.
5. **Resolve `@workspace/ui` from source via alias, not a `development` export condition.** `vite.config.ts` gets `{ find: /^@workspace\/ui\/(.*)$/, replacement: "<repo>/packages/ui/src/$1" }` (globals.css already resolves from `src/styles`), and `tsconfig.app.json` / `tsconfig.json` get a matching `paths` entry. `turbo.json` then drops `^build` from `dev`, `dev:aspire`, `test`, `test:run`, `test:coverage` and `typecheck`; `build` keeps it only because `packages/ui`'s own `build` doubles as its typecheck. Alternative: a `development` condition in `packages/ui` exports plus `customConditions` in every consumer tsconfig - rejected as more moving parts (two configs that must agree, and Vite's production build would still consume `dist`), while the alias also lets the production build tree-shake the ui package at source level. Vitest honours the Vite alias, so tests pick it up without extra config.
6. **`tsc -b` leaves the web `build*` scripts.** CI already runs `pnpm typecheck` immediately before `pnpm build:<mode>`; locally a developer runs `pnpm typecheck` on demand. Removing the duplicate saves about 40 s per build on the audit machine.
7. **Migration is file-by-file and reversible.** Every rewritten test file drops its `dexie-react-hooks` / query-module / MSAL / i18n mocks together, seeds data, and asserts via `findByRole` / `findByText` (async, because live queries resolve after mount). No shared "migration helper" beyond the two seed functions. Test ids stay where a role query would be ambiguous (Joyride targets still rely on them).

## Risks / Trade-offs

- [Real i18n resolves English copy, so tests that asserted on keys fail once their `react-i18next` mock is removed] -> mocks are removed only in files that are rewritten in this change; untouched files keep their mock and keep passing.
- [Eager glob of 34 locale files runs per worker] -> measured as part of task 4.1; if it adds more than a few seconds to the suite, restrict the glob to the namespaces page tests use and keep the rest lazy.
- [fake-indexeddb makes catalog reads asynchronous, so a synchronous `getBy*` right after `render` sees the loading state] -> rewritten tests use `findBy*` / `waitFor`; the seed helpers await the Dexie write before returning.
- [Dexie module singletons keep an open connection across tests in one file] -> `afterEach` deletes both databases, the same reset the package tests rely on; Dexie reopens on next access.
- [The MSAL stub drifts from what app code calls] -> the stub exposes exactly the nine instance methods enumerated in Context; an unknown call throws, which surfaces the drift in the first test that hits it.
- [Aliasing `@workspace/ui` to source means its `tsconfig` (`ES2022`, no `paths` to `@/...`) is type-checked under the web app's `tsconfig.app.json`] -> both are `strict` with `moduleResolution: bundler`; task 3.1 verifies `pnpm typecheck` from a clean `dist`-less checkout before the alias is kept.
- [Dropping `tsc -b` from `build` means a local `pnpm build` no longer type-checks] -> `pnpm typecheck` is one of the repository gates and lefthook stages run lint; CI order is unchanged.

## Migration Plan

1. Land the harness (group 1) with the existing tests untouched; the suite must stay green because every new provider is opt-in or overridden by existing per-file mocks.
2. Migrate test files slice by slice (group 2), each slice its own commit, so a regression bisects to one page.
3. Land the tooling change (group 3) last; rollback is reverting that single commit, the harness does not depend on it.

## Open Questions

- None that affect scope. Whether to also move the remaining 123 direct `@testing-library/react` imports to `@/test/render` is a style follow-up and is not tracked here.
