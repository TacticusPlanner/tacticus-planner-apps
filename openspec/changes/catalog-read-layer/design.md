# Design

## Context

See proposal.md - Why. Local data lives in two Dexie databases written only by the two sync loops (`packages/game-catalog/src/game-catalog-sync.ts`, `packages/player-data/src/player-data-sync.ts`) and deleted on sign-out (`shared/auth/sign-out.ts`). Reads go through `packages/*/src/queries.ts`, every one a whole-table `toArray()`, consumed through `useLiveQuery` per hook instance. TanStack Query is already the app's cache for server data (`app/providers/query-provider.tsx`), and `entities/legendary-event/model/use-query-read-state.ts` already adapts a query result to the shared `ReadState` type. Both sync results expose `downloaded: Key[]`.

## Goals / Non-Goals

**Goals:**

- One cache entry per dataset, filled by one local read, shared by every consumer; derived maps memoised by selector.
- Read state (loading / ready / error + retry, with a timeout) uniform across catalog, player data and server reads, using one type (`ReadState`).
- Sync providers and sync loops reduced to one implementation each.

**Non-Goals:**

- Changing the Dexie schemas, DB versions or indexes (no `where` indexes: filtering happens in memory, see Decision 3).
- Server-query freshness (`tune-client-query-caching`). Download concurrency and the `./sync` subpaths are in scope here (moved from `tune-client-query-caching` and `trim-startup-bundle`) because this change is the only one that rewrites the sync loop.
- Moving slices between FSD layers (`rehome-feature-logic`); consumers are rewritten in place.

## Decisions

1. **Reads are TanStack queries, keyed `["local", "catalog", <datasetKey>]` and `["local", "player", <chunkKey>]`, `staleTime: Infinity`, `gcTime: Infinity`, `retry: 1`.** The query function is the existing `getDatasetRecords` / `getChunkData` wrapped in a 15 s timeout (`Promise.race` with a timer; no new dependency). Hooks `useCatalogDataset(key, select?)` and `usePlayerChunk(key, select?)` live in `shared/local-data` (FSD `shared`, importable by every layer) and return `ReadState<T>` via `useQueryReadState` (moved from `entities/legendary-event/model` to `shared/lib`). Derived maps are module-level selector functions passed as `select`, which TanStack memoises per selector reference, so `getCharactersMap` becomes `useCatalogDataset("characters", toById)`.
   - Alternative: keep `useLiveQuery` and add a module-level memo in `queries.ts`. Rejected: no status/error/retry channel, no invalidation story, and the per-instance subscription cost stays.
   - Alternative: a React context "catalog provider" holding the common maps. Rejected: the query cache already is a shared store with subscription, dedupe and structural sharing; a provider would be a second cache to keep in sync and would force every dataset to load eagerly.
2. **Sync invalidates by `downloaded` list; other tabs are told over a `BroadcastChannel("tacticus-planner-local-data")`.** After a successful sync the provider calls `invalidateQueries` for each downloaded key and posts `{ source, keys }`; each tab's provider listens and invalidates the same keys. Sign-out already deletes both databases and the query client is cleared with it.
   - Alternative: the `storage` event. Rejected: needs a dummy localStorage write and payload encoding; `BroadcastChannel` is stdlib in every supported browser.
   - Alternative: keep Dexie's live observation for cross-tab. Rejected: that is the per-instance subscription we are removing.
3. **Filtered reads (`getLegendaryEventBattles(eventId)`, `getEventsActiveAt`, `getUpcomingEvents`, per-boss guild-raid meta) become selectors over the cached dataset**, not Dexie `where` queries. With one read per session, filtering in memory is cheaper than an index and needs no DB version bump. Selectors that take an argument are created with `useCallback`/`useMemo` on the argument so TanStack's select memo still applies.
4. **`useReadState(querier, deps)` is kept for composite reads but reimplemented over `useQuery`** (key `["local", "composite", name, ...deps]`, same timeout), so the 14 existing callers migrate by adding a name; `useUnitPowerContext` instead composes the six dataset hooks plus `combineReadStates(...)` (a ten-line helper returning loading if any is loading, error with a retry that retries every failed read if any failed, else ready with the tuple), so it no longer re-reads six tables per mount. The `LIVE_QUERY_ERROR` symbol copies and tagged status objects are deleted and their hooks migrated to the dataset hooks.
5. **`useUnitName` returns a `useCallback`-stable resolver** over the two cached maps and `t`; the `exhaustive-deps` disables that exist only because the resolver was a new closure are removed and the real dependencies listed (verify each disable's reason in place; keep the ones with another cause).
6. **One sync engine, one provider.** `runManifestSync({ loadMetadata, fetchManifest, selectChanged, fetchItem, replaceItem, finalize, onProgress })` in a new dependency-free `packages/manifest-sync` is called by both packages' `sync*` functions, which keep their public signatures. The sync itself runs as a query (`["sync", source]`, `staleTime: Infinity`, `retry: false`, `fetchQuery` on mount) so concurrent mounts dedupe in the query client and the two module-level `inFlightSync` singletons go away; progress goes through a tiny external store read with `useSyncExternalStore`. `GameCatalogProvider` and `PlayerDataProvider` become one `LocalDataSyncProvider` component rendered twice with a source config; the public hooks (`useGameCatalogStatus`, `usePlayerDataStatus`) keep their names and shapes so consumers do not change.
   - Alternative: `useMutation` for the sync. Rejected: mutations do not dedupe concurrent calls, which is the whole point of the singleton being replaced.
7. **`dexie-react-hooks` is removed from `apps/web` once the last `useLiveQuery` is gone**; `dexie` stays in the packages.

## Risks / Trade-offs

- [Memory: the largest datasets (`campaign-battles` ~2 MB JSON, `npcs` ~1.9 MB, `unit-power` ~0.7 MB) stay in heap for the session] → datasets load lazily per consumer and `gcTime: Infinity` only applies to entries that were requested; task 1.5 measures heap on the Characters page and the HSE page on a mid-range Android profile before merge; if a dataset exceeds ~10 MB in heap, give it a finite `gcTime`.
- [A writer other than sync (today only sign-out) adds a path that leaves memory stale] → `replace*`/`clear*`/`delete*` in the packages are the only writers; the provider owns invalidation and sign-out clears the query client; a test asserts that every storage write entry point is covered.
- [`BroadcastChannel` unavailable (very old WebView)] → feature-detect; without it the other tab refreshes on its next reload, which is today's behaviour.
- [Three sibling changes used to edit the same sync loops] → resolved by ownership: concurrency (`mapWithConcurrency` around `fetchItem` in `runManifestSync`) and the `./sync` subpaths both land here; `tune-client-query-caching` and `trim-startup-bundle` no longer touch the loops.
- [Page tests mock `dexie-react-hooks` and `@workspace/game-catalog/queries` by path] → `test-harness-render-app` must land first; migrated tests seed `fake-indexeddb` through the packages' `replace*` functions and render with the real hooks.
- [Timeout fires on a genuinely slow first read on a weak device] → 15 s is far above the measured cold read of the largest table; the failure shows Retry, not a dead end.

## Migration Plan

Client-only, no flag. Land in the task order below so each group keeps `pnpm test:run` green: hooks and engine first (additive), then consumers slice by slice, then deletion of the old idioms and the dependency. Rollback = revert the PR.

## Open Questions

- Whether `gcTime: Infinity` is acceptable for `campaign-battles` and `npcs` on low-memory devices is answered by the measurement in task 1.5; it changes a constant, not the approach.
