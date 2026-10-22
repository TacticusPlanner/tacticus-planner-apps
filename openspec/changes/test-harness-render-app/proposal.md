# Proposal

## Why

Page tests in `apps/web` stand in for the app's runtime with hand-written module mocks instead of the real providers: `react-i18next` is mocked in 146 of 530 test files, `@azure/msal-react` in 53, `dexie-react-hooks` in 50, `@workspace/game-catalog/queries` in 53 and `@workspace/player-data/queries` in 27, nearly always by deep module path and sometimes by inspecting the querier's source text (`querier.toString().includes("getCharactersMap")`). The upcoming read-layer refactor (`catalog-read-layer`) and the slice moves (`rehome-feature-logic`) change exactly those module paths and hook shapes, so without a harness that runs the real providers, those changes would break hundreds of tests that assert unchanged behavior.

## What Changes

- Extend the existing custom render in `apps/web/src/test/render.tsx` (already used by 125 test files) so one call can also provide a memory data router for a given route, the theme provider and real English translations; keep its current signature so existing call sites do not change.
- Run `i18next` for real in tests, initialised once in `apps/web/src/test/setup.ts` from the English resources under `apps/web/public/locales/en` with no network backend, so `useTranslation` resolves actual copy and tests can query by visible text and role.
- Replace per-file MSAL mocks with one test-owned auth stub, installed from `setup.ts`, with a small helper to set the signed-in state for a test.
- Run Dexie for real in tests via `fake-indexeddb` (already a dev dependency of `packages/game-catalog` and `packages/player-data`), with seed helpers that write through the packages' public storage functions, so `useLiveQuery`-backed hooks exercise the real read path.
- Migrate the page, feature and shared tests that mock `dexie-react-hooks`, `@workspace/game-catalog/queries` or `@workspace/player-data/queries` to seeded data and real providers, starting with Goals, Dailies, Legendary Events and Library pages. Tests that need no change are left alone; a test is rewritten only when its mocks target modules that `catalog-read-layer` will change, and when rewritten it prefers role- and text-based queries over test ids.
- Resolve `@workspace/ui` from source in the web app (Vite alias plus `tsconfig` paths) so `pnpm dev`, `pnpm typecheck` and `pnpm test:run` no longer require a prior `pnpm --filter ui build`; drop the duplicated `tsc -b &&` from the web `build*` scripts because CI runs `pnpm typecheck` immediately before `pnpm build` (`.github/workflows/_build-web.yml`).
- Record test-suite wall time before and after (baseline on the audit machine: 530 files, 5,094 tests, 181 s uncontended).

No user-facing behavior changes. This change sets `skip_specs: true`.

## Capabilities

### New Capabilities

- none

### Modified Capabilities

- none (test and developer tooling only; no requirement changes)

## Impact

- `apps/web/src/test/render.tsx`, `apps/web/src/test/setup.ts`, new helpers under `apps/web/src/test/` (auth state, catalog and player-data seeding).
- `apps/web/package.json` (adds `fake-indexeddb` dev dependency, removes `tsc -b &&` from `build`, `build:staging`, `build:production`), `apps/web/vite.config.ts`, `apps/web/tsconfig.app.json`, `apps/web/tsconfig.json`, `turbo.json` (web `dev`, `test*`, `typecheck` no longer depend on `^build`).
- Test files under `apps/web/src/fsd/pages/{dailies,library,legendary-events,goals,my-game,home,onslaught}`, `features/{daily-raids,legendary-event-teams,legendary-event-team-suggestions,home-screen-event-points,v1-import}`, `shared/{unit-power,unit-name,ui,auth}`, `entities/{npc,legendary-event}`.
- No API change and no companion `tacticus-planner-api` change.
- Relationship to sibling changes: `catalog-read-layer` and `rehome-feature-logic` depend on this change landing first. `client-baseline-hardening` owns the CI workflow test step; `shell-accessibility-and-lint` owns lint strictness and jsx-a11y; `rehome-feature-logic` owns knip configuration. None of those are touched here.
