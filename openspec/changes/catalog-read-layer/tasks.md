# Tasks

Prerequisite: `test-harness-render-app` is merged (page tests render with `fake-indexeddb`, not module-path mocks).

## 1. Read hooks and read state (`shared/local-data`, `shared/lib`)

- [ ] 1.1 Record the baseline: count IndexedDB `getAll` calls per route (Chrome Performance panel, IndexedDB track) on `/plan/goals` (50 goals), `/dailies/raids`, `/dailies/hse`, `/home`, `/legendary-events/:id`, `/library/characters/:id`; note the numbers at the end of this file under "Measurements"
- [ ] 1.2 Move `useQueryReadState` from `entities/legendary-event/model/use-query-read-state.ts` to `shared/lib` (re-export from the entity for now) and verify its existing tests pass from the new path
- [ ] 1.3 Add `shared/local-data` with `useCatalogDataset(key, select?)` and `usePlayerChunk(key, select?)` (query keys per design D1, `staleTime`/`gcTime` Infinity, `retry: 1`, 15 s timeout wrapper, module-level `toById` selectors) and verify unit tests with `fake-indexeddb` cover: one Dexie read for two mounted consumers, selector result referentially stable across re-renders, timeout reports `error`, retry re-reads and reaches `ready`
- [ ] 1.4 Add `combineReadStates(...states)` to `shared/lib` and reimplement `useReadState(name, querier, deps)` over `useQuery` with the same timeout; verify tests cover loading/ready/error/retry and that a single failed read among several only re-issues that read on retry
- [ ] 1.5 Measure heap on `/library/characters/:id` and `/dailies/hse` with the hooks mounted for `campaign-battles`, `npcs`, `unit-power` (Chrome Memory panel, mobile profile) and record the figures under "Measurements"; if any dataset exceeds ~10 MB retained, give it a finite `gcTime` and note it
- [ ] 1.6 Add the localized failure copy (message + Retry) for a failed local read to `apps/web/public/locales/{en,de,es,fr}/common.json` with real de/es/fr translations, and verify the i18n key test passes

## 2. Sync engine, provider and invalidation

- [ ] 2.1 Create `packages/manifest-sync` with `runManifestSync(...)` (design D6) and make `syncGameCatalog` and `syncPlayerData` call it with unchanged public signatures; verify both packages' existing sync tests pass unmodified and a new engine test covers: changed selection, per-item failure collection, metadata not advanced on failure, `downloaded` and `removed` lists on success, and the rejection error carrying the keys stored before the failure
- [ ] 2.2 Replace `GameCatalogProvider` and `PlayerDataProvider` with one `LocalDataSyncProvider` driven by a `["sync", source]` query (`fetchQuery` on mount, `retry: false`) and a `useSyncExternalStore` progress store; keep `useGameCatalogStatus` / `usePlayerDataStatus` names and shapes, keep the player-data hourly poll (as `fetchQuery` with `staleTime: 0`) and `refreshServerReadsAfterSync`; remove the `["sync"]` queries on sign-out; delete both `inFlightSync` singletons; verify `player-data-provider.test.tsx` and the catalog provider tests pass against the new component and a test shows two concurrent mounts issue one manifest request
- [ ] 2.3 After every sync run, resolved or rejected, invalidate `["local", <source>, key]` for each key in `downloaded ∪ removed` (from the result or from the rejection error) and the `["local", "composite"]` prefix, and post `{ source, keys }` on `BroadcastChannel("tacticus-planner-local-data")`; listen in the provider and invalidate the same keys; feature-detect the channel; verify tests cover: only written keys invalidated, empty lists invalidate nothing, a withdrawn optional dataset is invalidated, a partial failure still invalidates the stored keys, a mounted composite read refetches after a sync, and a posted message from another context invalidates in this one
- [ ] 2.4 Clear the `["local"]` queries on sign-out next to `deleteGameCatalogDb`/`deletePlayerDataDb` in `shared/auth/sign-out.ts` and verify the sign-out test asserts the cache is empty afterwards
- [ ] 2.5 (moved from `tune-client-query-caching`) In `runManifestSync` run the fetch-then-write worker over the changed items through a local `mapWithConcurrency(items, 4, worker)` (plain Promise + counter, no dependency); keep `onProgress` (`downloaded` increments as each item finishes), per-item failure collection and "do not advance metadata on failure"; verify engine tests assert at most 4 fetches pending at once and that one failure still stores the others, for both the catalog and the player-data source
- [ ] 2.6 (moved from `trim-startup-bundle`) Add `./sync` exports to `packages/game-catalog/package.json` and `packages/player-data/package.json` (new `src/sync.ts` re-exporting the HTTP client, sync function and schemas), remove those re-exports from each root `index.ts`, and have `LocalDataSyncProvider` `await import("@workspace/<pkg>/sync")` inside its run function; verify `pnpm typecheck`, `pnpm lint` (knip accepts the new entry points) and the provider tests pass, and `zod` no longer appears in the entry graph of a production build

## 3. Shared and entity consumers

- [ ] 3.1 Rewrite `shared/unit-name/use-unit-name.ts` over `useCatalogDataset("characters"/"mows", toById)` returning a `useCallback` resolver; verify its tests assert referential stability across re-renders and the raw-id fallback
- [ ] 3.2 Remove the `exhaustive-deps` disables whose only cause was the unstable resolver (`features/legendary-event-team-suggestions/model/use-team-suggestions.ts`, `features/legendary-event-teams/ui/team-unit-picker.tsx`, `features/legendary-event-tokens/model/use-next-token-shown.ts`, `pages/legendary-events/ui/legendary-event/use-upgrade-impact.ts`, `pages/legendary-events/ui/plan-wizard/use-plan-source.ts`), list the real deps, keep any disable with a different documented cause; verify `pnpm lint` passes and the affected tests pass
- [ ] 3.3 Rewrite `shared/unit-power/use-unit-power-context.ts` to compose six dataset hooks with `combineReadStates`, keeping the "not synced yet = loading" rule via the catalog status; verify its tests pass and a test shows two mounted consumers share one read per dataset
- [ ] 3.4 Migrate the ten `useReadState` callers under `entities/legendary-event/model` (events, event, battles, progress, sync times, units, horde-mode tiers, clear-estimate config) to `useCatalogDataset`/`usePlayerChunk` with argument selectors (design D3) for `getLegendaryEventBattles`, `getLegendaryEventProgress`; verify the entity tests pass and `pnpm lint:fsd` is clean
- [ ] 3.5 Migrate `app/layout/use-nav-items.ts` and `app/layout/hse-live-provider.tsx` so their minute timers re-select from the cached `events-calendar`, `lres`, `characters`, `mows` datasets instead of re-reading; verify `use-nav-items.test.tsx` and `nav-live-indicator.test.tsx` pass and the shell issues no local read on the minute tick

## 4. Page consumers

- [ ] 4.1 Goals: rewrite `pages/goals/model/shared/use-goal-catalog.ts` and the other `useLiveQuery` hooks under `pages/goals/model` over the dataset hooks; verify the Goals page tests pass with `fake-indexeddb` seeding and a test asserts one read per dataset with 20 rendered rows
- [ ] 4.2 Dailies: migrate `pages/dailies/model/*` (`use-daily-raids.ts`, `use-shop-recommendations.ts` and siblings), delete the `LIVE_QUERY_ERROR` symbol copies there, map their error paths to `ReadState`; verify the Dailies page tests pass and the retry scenario renders the failure copy from task 1.6
- [ ] 4.3 Library and My Game: migrate `pages/library/*` (character, MoW, NPC, raid-boss, shops lookups) and `pages/my-game/model/use-collection-view.ts` (delete its `LIVE_QUERY_ERROR`), keep each page's existing loading / failure / unavailable presentation per its spec; verify their tests pass
- [ ] 4.4 Home, Legendary Events pages, Guild and remaining `useLiveQuery` consumers under `pages/*` and `features/*`: migrate; verify `grep -rn useLiveQuery apps/web/src` returns nothing outside tests
- [ ] 4.5 Delete `dexie-react-hooks` from `apps/web/package.json`, delete the Dexie-based `useReadState` implementation and the tagged-status helpers with no callers; verify `pnpm install`, `pnpm typecheck` and `knip` report nothing dangling

## 5. Verification

- [ ] 5.1 Re-run the task 1.1 route measurement and record it under "Measurements"; verify every listed route reads each dataset at most once per session and `/plan/goals` issues under 10 local reads
- [ ] 5.2 Manual verification with the Aspire stack (populated account and a fresh device profile): (a) a page renders from memory after navigating away and back with no IndexedDB activity; (b) blocking IndexedDB in DevTools makes a page show the failure copy with Retry after 15 s and Retry recovers once unblocked; (c) with two tabs open, triggering a player-data sync in one updates the Collection page in the other without reload; (d) sign-out then sign-in on another account shows no data from the previous account. Layout is unchanged, so no desktop/mobile split; record results here
- [ ] 5.3 Remove the "stuck showing loading" entry from `KNOWN_ISSUES.md` and verify the file reads correctly
- [ ] 5.4 Run the gates `pnpm test:run`, `pnpm typecheck`, `pnpm lint`, `pnpm lint:fsd`, `git diff --check` and verify all pass

## Measurements

- Baseline (task 1.1): _to be filled_
- Heap (task 1.5): _to be filled_
- After (task 5.1): _to be filled_

## Workflow follow-up

- Open a `tacticus-planner-docs` change to describe the read layer in `architecture/frontend.md` (also stale on TanStack Query adoption).
- If `tune-client-query-caching` lands after this change, move its concurrency helper into `runManifestSync`.
- Archive after review requirements are satisfied.
