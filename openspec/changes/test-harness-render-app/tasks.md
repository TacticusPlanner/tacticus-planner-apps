# Tasks

## 1. Test harness foundation

- [ ] 1.1 Record the baseline: run `pnpm --filter web test:run` on an idle machine and note files, tests and wall time at the top of this file's `## Notes` section (audit baseline: 530 files, 5,094 tests, 181 s).
- [ ] 1.2 Add `fake-indexeddb` (same `^6.2.5` as `packages/game-catalog`) to `apps/web` devDependencies and import `fake-indexeddb/auto` in `apps/web/src/test/setup.ts`; verify with a one-assertion test that `indexedDB` is defined and `replaceGameCatalogDataset` followed by `getDatasetRecords` round-trips a record.
- [ ] 1.3 Initialise the real `i18next` instance in `setup.ts` from `import.meta.glob` of `apps/web/public/locales/en/*.json` (eager, `lng: "en"`, `useSuspense: false`, `initImmediate: false`) and mock `@/shared/config/i18n/i18n` to export that instance; verify with a test that renders a component using `useTranslation("common")` without any per-file mock and finds the English string by text.
- [ ] 1.4 Create `apps/web/src/test/auth.ts` exporting `setTestAuth` and stub `useIsAuthenticated`, `useMsal`, `MsalProvider` and an `instance` with the nine methods listed in design.md; install it from `setup.ts` via `vi.mock("@azure/msal-react")` / `vi.mock("@azure/msal-browser")` and reset state in `afterEach`; verify with tests for signed-out default, `setTestAuth({ authenticated: true })` and that an unimplemented instance method throws.
- [ ] 1.5 Create `apps/web/src/test/seed.ts` with `seedGameCatalog` and `seedPlayerData` built on `replaceGameCatalogDataset` / `replacePlayerDataChunk`, and add `afterEach` deletion of both Dexie databases in `setup.ts`; verify with a test that a `useLiveQuery` hook over `getCharactersMap` resolves the seeded character and that the next test starts from an empty store.
- [ ] 1.6 Extend `apps/web/src/test/render.tsx` with optional `route`, `initialEntries`, `theme` and `auth` options (memory data router via `createMemoryRouter` + `RouterProvider`, `ThemeProvider` from `@/shared/theme`, `setTestAuth` applied before render); verify with tests that the default call renders exactly as before (no router, no theme), that `route: "/plan/goals/:goalId"` with `initialEntries` exposes `useParams`, and that `theme: true` applies the stored theme class.
- [ ] 1.7 Run `pnpm --filter web test:run` and confirm the full existing suite is green with the new setup in place (no existing test rewritten yet).

## 2. Migrate tests off module-path mocks (one commit per slice)

- [ ] 2.1 Dailies pages (`apps/web/src/fsd/pages/dailies`, 11 files mocking catalog queries, including the two `querier.toString().includes(...)` dispatchers): remove `dexie-react-hooks`, `@workspace/game-catalog/queries`, `@workspace/player-data/queries`, MSAL and `react-i18next` mocks, seed via `seedGameCatalog` / `seedPlayerData`, assert with `findByRole` / `findByText`; verify `pnpm --filter web test:run src/fsd/pages/dailies` is green and `grep -rl 'vi.mock("dexie-react-hooks"' src/fsd/pages/dailies` returns nothing.
- [ ] 2.2 Library pages (`pages/library`, 8 files) migrated the same way; verify the directory's suite is green and no `@workspace/game-catalog/queries` mock remains in it.
- [ ] 2.3 Legendary Events pages and features (`pages/legendary-events`, `features/legendary-event-teams`, `features/legendary-event-team-suggestions`, `entities/legendary-event`, 11 files) migrated; verify their suites are green and no `dexie-react-hooks` mock remains in them.
- [ ] 2.4 Goals pages and `features/daily-raids` (6 + 3 files) migrated; verify their suites are green and no query-module mock remains in them.
- [ ] 2.5 Remaining slices (`pages/my-game`, `pages/home`, `pages/onslaught`, `features/v1-import`, `features/home-screen-event-points`, `shared/unit-power`, `shared/unit-name`, `shared/ui`, `shared/auth`, `entities/npc`) migrated; verify `grep -rl 'vi.mock("dexie-react-hooks"\|vi.mock("@workspace/game-catalog\|vi.mock("@workspace/player-data' apps/web/src` returns no test file.
- [ ] 2.6 Remove per-file `@azure/msal-react` / `@azure/msal-browser` mocks from every file rewritten in 2.1-2.5 in favour of `setTestAuth`; verify `grep -rl 'vi.mock("@azure/msal' apps/web/src` lists only files not touched by this change, and note the remaining count in `## Notes`.

## 3. Dev tooling

- [ ] 3.1 Add the `@workspace/ui/*` -> `packages/ui/src/*` alias to `apps/web/vite.config.ts` and matching `paths` to `apps/web/tsconfig.app.json` and `tsconfig.json`; verify by deleting `packages/ui/dist` and running `pnpm --filter web typecheck`, `pnpm --filter web test:run` and `pnpm --filter web build:staging` successfully, and that `pnpm --filter web dev` serves the app with ui components rendering.
- [ ] 3.2 Remove `^build` from the `dev`, `dev:aspire`, `test`, `test:run`, `test:coverage` and `typecheck` tasks in `turbo.json`; verify `pnpm typecheck` and `pnpm test:run` from the repo root succeed from a clean checkout without `packages/ui/dist`, and that `turbo run typecheck --dry-run` no longer lists `ui#build` as a dependency.
- [ ] 3.3 Drop `tsc -b && ` from the `build`, `build:staging` and `build:production` scripts in `apps/web/package.json`; verify `pnpm build:staging` succeeds and `.github/workflows/_build-web.yml` still runs `pnpm typecheck` before the build step (no workflow edit needed).
- [ ] 3.4 Document the harness in the `vitest` skill under `.agents/skills/vitest` (render options, `setTestAuth`, seed helpers, "assert by role or text, not keys"); verify the documented snippet is copied from a passing test in this change.

## 4. Integration

- [ ] 4.1 Re-run `pnpm --filter web test:run` on an idle machine, record files, tests and wall time under `## Notes` next to the baseline, and confirm the total test count did not drop (rewritten tests replace, never delete, assertions).
- [ ] 4.2 Run the repository gates `pnpm test:run`, `pnpm typecheck`, `pnpm lint`, `pnpm lint:fsd` and `git diff --check`; verify all pass.

## Notes

- Baseline (before): _fill in 1.1_
- After: _fill in 4.1_
- Remaining per-file MSAL mocks after 2.6: _fill in_
