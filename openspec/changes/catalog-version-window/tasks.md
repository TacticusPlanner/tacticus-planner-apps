# Tasks

## 1. Contract

- [ ] 1.1 Regenerate `apps/web/src/fsd/shared/api/schema.d.ts` from the API change's OpenAPI artifact (`GameCatalogVersions`, the manifest `gameVersion` query, and `catalogVersion`/`effectiveCatalogVersion` on settings). Verify with `pnpm typecheck` and the `api-contract-sync` check.

## 2. Per-version catalog storage and sync (`packages/game-catalog`)

- [ ] 2.1 `game-catalog-storage.ts`: `openGameCatalogDb(gameVersion)` returns a memoized Dexie instance named `tacticus-planner-game-catalog-<gameVersion>` with today's store schema, a `complete` marker in `metadata` written only by finalize, and `deleteGameCatalogDb(name)`. Verify with storage tests (fake-indexeddb): two versions are isolated, and `complete` is absent after a partial write.
- [ ] 2.2 `game-catalog-api.ts`: the manifest fetch takes an optional `gameVersion` (query parameter), and a new `fetchGameCatalogVersions()` sends an ETag. Add a zod schema for the versions response. Verify with API client tests, including the `404` for an unserved version.
- [ ] 2.3 `game-catalog-sync.ts`: `syncGameCatalog({ gameVersion })` writes only to that version's database. It checks that the manifest's `gameVersion` matches the database it is writing, and refuses otherwise. It marks `complete` only when every dataset succeeded. Verify with sync tests: a failed dataset leaves `complete` unset and the other database untouched; a 304 on a complete database is a no-op.
- [ ] 2.4 The query helpers in `@workspace/game-catalog/queries` take `gameVersion` as their first argument and read only complete databases. Verify with `pnpm --filter @workspace/game-catalog test:run` and `pnpm typecheck` (every missed caller is a type error).

## 3. Selected release (`entities/catalog-release`, `shared/local-data`, app providers)

- [ ] 3.1 Create the `entities/catalog-release` slice:
  - the versions query (`["catalog-releases"]`, one-hour `staleTime`);
  - `resolveCatalogRelease(stored, window)`, pure, returning `{ gameVersion, isLatest, expiredPin? }`;
  - the device storage helpers for `tp.catalogRelease` and `tp.catalogRelease.acknowledgedLatest` through `safeStorage`;
  - a public API in `index.ts`.
  - Verify with unit tests of `resolveCatalogRelease`: Latest; a served pin; an expired pin; an empty window.
- [ ] 3.2 Add `CatalogReleaseContext` in `shared/local-data`. Have `useCatalogDataset` key on `["local","catalog",gameVersion,key]`. Move the 9 direct `@workspace/game-catalog/queries` importers (`entities/legendary-event/model/use-legendary-event.ts`, `shared/unit-power/use-unit-power-context.ts`, `features/rank-lookup/lib/rank-lookup.mapper.ts`, …) onto the context. Verify with existing tests, and with a hook test showing that changing the context value re-reads from the other database without a remount.
- [ ] 3.3 `game-catalog-provider.tsx` and `game-catalog-init-gate.tsx`:
  - resolve the selection (signed-in: device hint, then `effectiveCatalogVersion`; guest: device storage), provide the context, and sync only that release;
  - on an expired pin, use latest and raise a one-time toast;
  - after the versions list loads, run the database cleanup (D2).
  - Verify with provider tests for each source and an expired-pin case, and a cleanup test for unserved and legacy databases and for a failed versions list (nothing deleted).
- [ ] 3.4 `refresh-after-sync.ts`: the broadcast message carries `gameVersion`, and selection changes are broadcast and applied in other tabs. Verify with a two-channel test.
- [ ] 3.5 Make unknown-id rendering consistent (name from the generated namespace or the raw id; the generic unknown icon). Filter ids that have no catalog record in the calculation entry points that iterate player data: daily raids, goal estimates, Legendary Event roster potential and HSE projection. Verify with tests that render a roster containing `lostaFearmonger` against a 1.43 fixture and get no throw, with Daras excluded from raid suggestions.

## 4. Switching (`features/switch-catalog-release`, account menu)

- [ ] 4.1 `useSwitchCatalogRelease()`: sync the target if it is incomplete, then save (signed-in: `PUT settings` with `catalogVersion` and the current revision; guest: device storage), then update the context. On any failure nothing changes and an error toast shows. Verify with feature tests: an already-synced switch makes no request; a download failure keeps the old release; a save conflict keeps the old release.
- [ ] 4.2 `widgets/account-menu`:
  - add a Game data row below Language in `PreferencesSection` and a `CatalogReleasePickerView` (radio group, Latest with its version, then the previous release, a downloading state, and an "unavailable" note when the list fails), in both the signed-in card and `guest-account-menu.tsx`;
  - the footer shows the selected version plus "(latest)".
  - Verify with component tests for listing, selection, downloading, list failure and the footer text.
- [ ] 4.3 Add the i18n keys for the row, picker, footer suffix, toasts and unavailable note to the `common` namespace in en, de, es and fr, with real translations at the quality of the sibling `common` keys. Verify with the locale alignment tests.
- [ ] 4.4 Update `general.tutorial.tsx`'s `tour.steps.accountMenu.content` and `tour.steps.accountDrawer.content` in all four locales to mention choosing the game data version. Verify with the tutorial tests.

## 5. Release banner (`widgets/catalog-release-banner`)

- [ ] 5.1 Build the banner widget:
  - shown when the latest game version differs from `tp.catalogRelease.acknowledgedLatest`; on first visit, record silently;
  - copy depends on whether the visitor is on Latest or on the previous release, with the matching action through `useSwitchCatalogRelease`, and a dismiss;
  - both action and dismiss record the version;
  - hidden when the versions list fails or the window has fewer than two releases;
  - `Alert` + `AlertAction`, following `order-conflict-banner.tsx`.
  - Verify with widget tests for every spec scenario.
- [ ] 5.2 Mount it in the app shell below the global header. On mobile its actions stack under the text (`useIsMobile()`). Verify with a shell test at both widths.
- [ ] 5.3 Add the banner i18n keys to `common` in en, de, es and fr, translated. Verify with the locale alignment tests.

## 6. Generated data from two pins

- [ ] 6.1 `scripts/datamine.mjs`:
  - two-line `apps/web/datamine/REF` (`latest …` / `previous …`);
  - `ensureDatamine(release)` with a cache per release;
  - `pull <tag>` rolls the pins and `--refresh <release>` re-pulls one;
  - CI rejects a `local` pin on either line.
  - Pin `previous` to `v1.43.157.2989`.
  - Verify by pulling into a scratch checkout, and with the CI check against a `local` line.
- [ ] 6.2 `generate-game-names-i18n.mjs`, `generate-ability-text-i18n.mjs` and `generate-raid-boss-i18n.mjs` generate per release and merge per id with `latest` winning. Re-run them, and commit the output (it is expected to equal today's 1.44 output plus any previous-only ids). Update the pinned counts in `npc-ability-text-translations.test.ts` if previous-only ids appear. Verify that re-running gives no diff and that the generators exit 0.
- [ ] 6.3 `datamine-sprites.mjs` copies from `latest`, else `previous`, and fails when neither has the file. Verify with `pnpm datamine:sprites` and the CI folder check.
- [ ] 6.4 Update the `AGENTS.md` section "Game data from the datamine" for the two pins, roll and refresh. Verify the documented commands run as written.

## 7. Platform-independent verification (Aspire stack, signed-in account with a synced roster)

- [ ] 7.1 With the API change deployed locally:
  - switch Latest → 1.43.157 → Latest and confirm the quest events list changes (Eradicator/Daras/Weirdboy/Parasite/Champion versus Cyrus/Eradicator/Sternguard/Sekhetar/Champion);
  - the second switch makes no dataset request (network panel);
  - after a reload the choice persists, and a second browser profile signed in to the same account picks it up.
- [ ] 7.2 Offline (DevTools offline), switch between two already-synced releases. Confirm it works and that a never-synced release shows the retryable error without changing the selection.
- [ ] 7.3 Data state for the expired-pin case: set the account's stored `catalogVersion` to a version outside the window (API test hook or a direct DB edit in local Postgres). Confirm the toast, Latest selected, and the planner on latest.
- [ ] 7.4 Data state for the banner: set `tp.catalogRelease.acknowledgedLatest` to `1.43.157.2989` in local storage. Confirm the Latest banner and its "Use 1.43.157" action. Then pin to 1.43 and confirm the "Use latest" variant.

## 8. Desktop verification (viewport ≥ 768px)

- [ ] 8.1 Account popover: Game data row position, picker, downloading state, footer "(latest)"; keyboard operation and focus return.
- [ ] 8.2 Banner layout in the desktop header area, both copies, dismiss.
- [ ] 8.3 Shell tour: the desktop account-menu step shows the updated text.

## 9. Mobile verification (viewport < 768px, same-origin 420px iframe)

- [ ] 9.1 Account drawer and the signed-out mobile settings: Game data row and picker.
- [ ] 9.2 Banner on the mobile top bar with stacked actions, both copies, dismiss.
- [ ] 9.3 Shell tour: the mobile account-drawer step shows the updated text.

## 10. Gates

- [ ] 10.1 `pnpm test:run`, `pnpm typecheck`, `pnpm lint`, `pnpm lint:fsd` and `git diff --check` all pass.

## Workflow follow-up

- Apply after the companion `tacticus-planner-api` change. Archive both only when both PRs are green and their review threads are resolved.
- Update the workspace `tp-bump-datamine` skill for the two-pin roll in both repos.
