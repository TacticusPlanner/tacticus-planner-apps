# Tasks

## 1. Spec copy and generated types

- [x] 1.1 Add `openapi-typescript` (dev) and `openapi-fetch` to `apps/web`. Verify `pnpm install --frozen-lockfile` succeeds after the lockfile update.
- [x] 1.2 Write `apps/web/scripts/api-spec.mjs` with `pull <sha|branch>`, `pull --local` and the regenerate mode (design decision 1), and add the `api:pull` / `api:types` scripts. Verify `pnpm api:pull main` writes `openapi/api.json` and a full SHA to `openapi/api.ref`, and that `pnpm api:pull --local` writes `local`.
- [ ] 1.3 Pull the spec at the API half's merge SHA and commit `openapi/api.json`, `openapi/api.ref` and the generated `src/fsd/shared/api/schema.d.ts`. Verify running `pnpm api:types` again produces no diff.
- [x] 1.4 Document the pull flow (local while pairing with an API branch, SHA before merge) in `apps/web` developer docs or AGENTS.md. Verify the documented commands run.

## 2. Typed client

- [x] 2.1 Add the lazy `openapi-fetch` client, the auth/`readError` middleware, the late-bound `fetch` and `unwrap` to `shared/api` (design decision 2), next to the existing functions. Verify with `api-client.test.ts` cases: bearer header sent, 409 problem → `ApiError` with `issueCode`/`current`/`errors`, 204 → `undefined`, network `TypeError` still classified transient.
- [x] 2.2 Add the shared `lastRequest()` test helper for asserting method, URL and JSON body of the `Request` sent through mocked `fetch`. Verify it's used by the 2.1 tests.

## 3. Migrate entity API modules

Each task: move the module to the typed client, replace its hand-written wire types with aliases of generated schemas (design decision 3), and update its tests. Verify `pnpm typecheck` and the slice's tests pass.

- [x] 3.1 goal (`goal.api.ts`, `goal/model/types.ts`)
- [x] 3.2 project
- [x] 3.3 legendary-event-plan (plans, run records, roster)
- [x] 3.4 account and planning-settings
- [x] 3.5 guild and guild-raid-status
- [x] 3.6 player-data-override (campaign-event-progress, onslaught-progress)

## 4. Remove the old client and guard CI

- [x] 4.1 Delete `apiGet`/`apiPost`/`apiPut`/`apiDelete` and `request<T>`. Verify `grep -rn "apiGet\|apiPost\|apiPut\|apiDelete" apps/web/src` is empty and `pnpm lint` (eslint and knip) passes.
- [x] 4.2 Add the regenerate-and-diff step and the `api.ref != local` step to `.github/workflows/_build-web.yml` (design decision 5). Verify each step command fails locally on a hand-edited `schema.d.ts` and on `api.ref` set to `local`, and passes on the committed state.

## 5. Integration

- [x] 5.1 Run the full gate (`prettier --check`, `pnpm lint`, `pnpm lint:fsd`, `pnpm typecheck`, `pnpm test:run`, `pnpm build`) and verify it passes.
- [x] 5.2 Through the Aspire stack, exercise goals, projects, an LE page with run history, guild raids and account settings on desktop and mobile. Verify there are no console errors, the request counts match those recorded for rebuild-foundation-pre-launch, and a forced 409 still adopts current state.
  - Done 2026-10-22 against the Aspire stack (API on this change's contract):
    - Cold-load request counts match rebuild-foundation-pre-launch exactly: /home 8, /plan/goals 9 (incl. `?archived=true`), /plan/projects 8, /dailies/raids 8, LE tauFarsight 10.
    - lostaBile run history: Load more pages 19→23 earlier runs via `?after=<cursor>`; opening an earlier run reads its roster.
    - A forced 409 (target edited in a second tab) shows the conflict with Refresh; refresh, then save succeeds (PUT 409, then 200).
    - Planning settings save round-trips `xpBookRarity: "Legendary"`.
    - Mobile (420px iframe): goals (16 rows) and LE pages render.
    - No console errors in either tab.
    - Not exercised: the guild page itself (the account has no registered guild); its state enum is covered by API tests.

## 6. Route rename

- [x] 6.1 Follow the API's route rename (no `me/` prefix; `account`, `settings`, `guild`): regenerate `schema.d.ts` from the local spec, update every `apiClient()` path and the URL assertions in tests and comments. Verified: typecheck (the generated `paths` reject any stale route), lint, FSD lint and all tests pass.
