# Tasks

Spec deltas deliberately omitted: none proposed beyond the new `client-data-freshness` capability (the proposal lists no modified capabilities; existing page specs describe what is shown, not how often it is fetched).

## 1. Request-count measurement harness (baseline before any code change)

- [ ] 1.1 Add `@playwright/test` as an `apps/web` devDependency and `apps/web/playwright.config.ts` (`testDir: "e2e"`, `baseURL` from `VITE_APP_URL` or the Aspire web URL, `use.storageState: "e2e/.auth/user.json"`); add `e2e/**` to `test.exclude` in `apps/web/vite.config.ts` so Vitest does not pick up `*.spec.ts`, add `e2e/**/*.ts` to `apps/web/knip.json` `entry`, and gitignore `apps/web/e2e/.auth/`. Verify: `pnpm --filter web test:run` still runs only Vitest files and `pnpm lint` passes.
- [ ] 1.2 Write `apps/web/e2e/request-count.spec.ts`: for each of `/home`, `/plan/goals`, `/plan/projects`, `/dailies/raids`, `/legendary-events/<eventId>` (event id from `E2E_LEGENDARY_EVENT_ID`) record the number of `/api/` requests (and total response bytes) on a cold load (`page.goto`) and on a warm re-navigation (in-app link away and back without reload), and print a Markdown table. The signed-in storage state is captured once by hand with `playwright-cli open <app-url>`, sign in, `playwright-cli state-save apps/web/e2e/.auth/user.json` (see the `playwright-cli` skill); document that in a comment at the top of the spec. Verify: `pnpm --filter web exec playwright test` against the Aspire stack prints the table.
- [ ] 1.3 Run 1.2 on `main` before touching any code and paste the table under `## Measurements` → `Before` at the bottom of this file. Verify: the table has both cold and warm columns for all five routes.

## 2. Query client defaults and key scoping

- [ ] 2.1 In `apps/web/src/fsd/app/providers/query-provider.tsx` set `staleTime: 5 * 60 * 1000` (leave `refetchOnMount` at its default so stale and invalidated-but-inactive queries refetch on their next mount; keep `refetchOnReconnect`/`refetchOnWindowFocus` false, `retry` false). Extend `query-provider.test.tsx` to assert the defaults. Verify: the test passes.
- [ ] 2.2 In `apps/web/src/fsd/entities/account/api/account.queries.ts` give `accountQueries.current()` a `staleTime` function that returns `0` while `!isAccountSetupComplete(query.state.data)` (or data is undefined) and the default otherwise; leave `userJotToken` at `staleTime: 0, gcTime: 0`. Add a test in `account.queries.test.ts` (new, beside the file) covering both branches. Verify: test passes; `onboarding-gate` tests still pass.
- [ ] 2.3 In `apps/web/src/fsd/entities/player-data-override/api/onslaught-progress.queries.ts` change `all()` to `["player-data-overrides", "onslaught"]` and `current()` to `[...all(), "current"]`; update `apps/web/src/fsd/features/v1-import/ui/v1-import-panel.test.tsx` and `apps/web/src/fsd/pages/onslaught` tests that assert the key. Add a test asserting `campaignEventProgressQueries.all()` is not a prefix match of `onslaughtProgressQueries.all()`. Verify: tests pass.
- [ ] 2.4 Remove the now-redundant explicit `staleTime: 5 * 60 * 1000` from `campaign-event-progress.queries.ts` (the client default covers it) and keep its comment about the save path. Verify: `pnpm typecheck` and the override tests pass.

## 3. Response-first goal mutations (`pages/goals`, `features/goal-order`)

- [ ] 3.1 Add `projectQueries.details()` (`[...all(), "detail"]`, the prefix of every per-project member list) to `apps/web/src/fsd/entities/project/api/project.queries.ts` and export it; add a key test in `project.queries.test.ts`. Verify: test passes.
- [ ] 3.2 `apps/web/src/fsd/pages/goals/model/goals-data/use-goal-actions.ts`: delete the `mutation.onSuccess` blanket invalidation and `invalidateAll`. `setStatus`/`setStatusMany`: write each `updateGoalStatus` response with `setQueryData(goalQueries.detail(id).queryKey, goal)` and patch the goal into cached goal lists and project member lists (extend `optimistic-goal-status.ts` to take the response's `status`/`globalPriority`); for a transition to `Completed`/`Archived` additionally invalidate `goalQueries.lists()` and `projectQueries.details()` once after the whole operation. `remove`/`removeMany`: keep the removal patch; invalidate `goalQueries.lists()` + `projectQueries.details()` once on success (positions shift) and on failure (restore). `addToProject`/`removeFromProject`: write the returned goal with `setQueryData(goalQueries.detail(id).queryKey, goal)` and patch its `projectIds`/`projects` into cached goal lists, then invalidate only `projectQueries.goals(id)` for the project(s) named in the call. Update `use-goal-actions.test.tsx` to assert the cache contents after each action and that `goalQueries.all()`/`projectQueries.all()` are never invalidated. Verify: tests pass.
- [ ] 3.3 `apps/web/src/fsd/pages/goals/model/goal-edit/use-goal-edit-save.ts`: after `setQueryData(detail)` and `applyOrder`, patch the returned goal's summary fields (`status`, `notes`, `dependsOn`, `updatedAt`, `globalPriority`) into cached `goalQueries.lists()` and `projectQueries.details()` entries; replace the blanket invalidation with `invalidateQueries(projectQueries.details())` only when `request.projectIds` was sent, and `invalidateQueries(goalQueries.lists(), { refetchType: "none" })` when `order` was returned. `refreshGoal` keeps its detail write and invalidates `goalQueries.lists()` only. Add `use-goal-edit-save.test.tsx` beside the hook asserting the cache after a notes-only save, a projects save and a priority save. Verify: tests pass.
- [ ] 3.4 `apps/web/src/fsd/features/goal-order/model/use-goal-order-actions.ts` `refresh()`: replace `projectQueries.all()` with `projectQueries.details()` so the project list is not refetched per drop; update `use-goal-order-actions.test.ts`. Verify: test passes.
- [ ] 3.5 `apps/web/src/fsd/pages/goals/model/goal-creation-form/use-goal-submit.ts`: on `createCombinedGoals` success, `setQueryData(goalQueries.detail(id).queryKey, goal)` for each returned goal, invalidate `goalQueries.lists()` and `projectQueries.goals(id)` for each `projectIds` entry of the returned goals; then delete `refreshGoals` and its `onCreated` wiring in `apps/web/src/fsd/app/layout/app-shell.tsx` (the create-goal and create-project dialogs no longer need a shell-level refresh). Add a test for the hook's cache effects. Verify: tests pass and `pnpm lint` reports no unused prop.
- [ ] 3.6 `apps/web/src/fsd/pages/legendary-events/ui/plan-wizard/use-plan-create.ts`: replace the `goalQueries.all()` + `projectQueries.all()` invalidation with `goalQueries.lists()` + `projectQueries.goals(projectId)` for the wizard's project. Verify: existing plan-wizard tests pass.

## 4. Response-first project mutations (`features/project-management`, `pages/goals/model/projects`)

- [ ] 4.1 `apps/web/src/fsd/features/project-management/model/use-project-actions.ts`: on `create` append the returned `ProjectSummary` to `projectQueries.list()`; on `save` replace it in the list; drop the `goalQueries.all()` invalidation; on a 409 invalidate `projectQueries.list()` only. Update `use-project-actions.test.ts`. Verify: tests pass.
- [ ] 4.2 `apps/web/src/fsd/pages/goals/model/projects/use-inline-project-create.ts`: delete the follow-up `invalidateQueries(projectQueries.all())` (the response is already the server's name/color); update `use-inline-project-create.test.tsx`. Verify: test passes.
- [ ] 4.3 `apps/web/src/fsd/features/project-management/ui/add-goals-to-project-sheet.tsx`: on save success invalidate only `projectQueries.goals(project.projectId)`; on the stale 409 invalidate `goalQueries.lists()` instead of `goalQueries.all()`. Update `add-goals-to-project-sheet.test.tsx`. Verify: tests pass.

## 5. Responses currently discarded (guild, Tacticus integration, V1 import)

- [ ] 5.1 Guild: change `GuildRegistrationForm.onRegistered` and `GuildSynchronizationCard.onSynchronized` (`apps/web/src/fsd/features/guild-access/ui/*`) and `GuildRegisteredView.onSynced` (`apps/web/src/fsd/pages/guild/ui/guild-registered-view.tsx`) to pass the `RegisteredGuild` response; in `guild-access-boundary.tsx` write it with `setQueryData(guildQueries.current().queryKey, { state: "registered", guild })` instead of `query.refetch()` (keep `refresh` = refetch for the error Retry and for `GuildTacticusUserIdCard`). Update `guild-access-boundary.test.tsx` to assert no refetch after register/sync. Verify: tests pass.
- [ ] 5.2 Account: add `applyTacticusIntegrationResult(queryClient, result)` in `apps/web/src/fsd/entities/account/model/` that patches the cached `CurrentUser` (`hasCompletedOnboarding: result.tacticusApiKeyConfigured`, `tacticusApiKeyMasked`, `tacticusUserIdMasked`) and export it; call it in `manage-account-dialog.tsx` and `guild-tacticus-user-id-card.tsx` (drop that card's `refetchCurrentUser()`); leave `api-key-form.tsx`'s `onCompleted` refresh as is (account-setup requires the refreshed state). Add a unit test for the patch and update `manage-account-dialog.test.tsx`. Verify: tests pass.
- [ ] 5.3 `apps/web/src/fsd/features/v1-import/ui/v1-import-panel.tsx`: remove the `refetch()` call and keep the single `invalidateQueries(accountQueries.all())`; update `v1-import-panel.test.tsx` to assert exactly one current-user refetch. Verify: test passes.

## 6. Forms read request state from the mutation (moved here from `persist-view-state-in-url`; same files as group 5)

- [ ] 6.1 Remove the parallel `status`/`errorMessage` state in `features/account-onboarding/ui/api-key-form.tsx`, `features/guild-access/ui/guild-registration-form.tsx`, `guild-synchronization-card.tsx`, `guild-tacticus-user-id-card.tsx`, deriving pending, success and the translated error from the mutation (`isPending`, `error`); do it in the same edit as 5.1/5.2 so each file is touched once. Verify: each file's existing test passes unchanged.
- [ ] 6.2 Do the same in `features/account-management/ui/manage-account-dialog.tsx` (both forms), `features/v1-import/ui/v1-import-panel.tsx` (keep `result`), `pages/goals/model/goal-creation-form/use-goal-submit.ts`, `pages/guild/ui/guild-purge-dialog.tsx`, `pages/guild/ui/guild-registered-view.tsx`. Verify: their existing tests pass unchanged and `grep -rn "setStatus(\"submitting\")" apps/web/src` returns nothing.

Download concurrency for catalog datasets and player-data chunks moved to `catalog-read-layer` (it rewrites both sync loops into one engine); the `client-data-freshness` requirement on bounded downloads is implemented there.

## 7. Integration checks

- [ ] 7.1 Run `pnpm test:run`, `pnpm typecheck`, `pnpm lint`, `pnpm lint:fsd` and `git diff --check`. Verify: all green.
- [ ] 7.2 Manual check with the Aspire stack signed in (data state: an account with at least 5 goals across 2 projects, one Paused goal, and a registered guild): pause a goal and confirm in DevTools that exactly one `POST .../status` is sent and no `GET me/goals`/`GET me/projects` follows; navigate Goals → Schedule → Goals and confirm no `/api/` request on the return; register/sync the guild and confirm no `GET guilds/me` follows. Verify: observed request lists match the three scenarios.
- [ ] 7.3 Re-run the request-count script (1.2) and paste the table under `## Measurements` → `After`; confirm warm columns are 0 for every route and cold columns did not increase. Verify: the After table is recorded below.

## Measurements

### Before

_(paste the table from task 1.3)_

### After

_(paste the table from task 7.3)_
