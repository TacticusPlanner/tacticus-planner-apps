# Proposal

## Why

Every component that needs catalog or player data reads it straight from IndexedDB through its own `useLiveQuery`, deserialising whole tables per hook instance and again on every remount (about 240 call sites in 56 files; the Goals page issues about 61 whole-table reads before its first row and 28 more per row). A bare `useLiveQuery` has no error or timeout channel, which is the known "page occasionally stuck showing loading" issue (`KNOWN_ISSUES.md`). This change puts one in-memory read layer over the local databases so each dataset is read once per session and every read can fail, time out and be retried.

Evidence (audit 2026-10-20): `apps/web/src/fsd/pages/goals/model/shared/use-goal-catalog.ts` (14 live reads, mounted per goal row and per name link from `goal-table-row.tsx` / `goal-row-shared.tsx`); `shared/unit-name/use-unit-name.ts` (reads characters and mows per instance and returns a new closure each render, forcing `exhaustive-deps` disables in `features/legendary-event-team-suggestions`, `features/legendary-event-teams`, `features/legendary-event-tokens`, `pages/legendary-events`); `shared/unit-power/use-unit-power-context.ts` (six whole tables per mount, mounted by the character, MoW, NPC, HSE and HRE pages); four competing read idioms: bare `useLiveQuery`, the `LIVE_QUERY_ERROR` symbol (five copies under `pages/dailies/model` and `pages/my-game/model`), tagged status objects, and `shared/lib/use-read-state.ts` (the right one, 14 callers); `app/providers/game-catalog-provider.tsx` and `player-data-provider.tsx` are near-duplicate sync state machines with module-level in-flight singletons over near-duplicate loops in `packages/game-catalog/src/game-catalog-sync.ts` and `packages/player-data/src/player-data-sync.ts`.

## What Changes

- Catalog datasets and player-data chunks are read through the existing TanStack Query client, one cache entry per dataset, kept fresh indefinitely and refreshed only when a sync replaces that dataset. Derived lookups (maps by id, filtered subsets such as one event's battles) are selectors over the cached dataset, so a page reads each table at most once per session no matter how many components need it. IndexedDB becomes persistence only.
- A sync that downloads datasets refreshes exactly those cache entries, in the tab that synced and in every other open tab of the app.
- Every local read has one state model: loading, ready, or failed with a retry. A read that does not settle within a bounded time is reported as failed with retry instead of spinning forever. The bare `useLiveQuery`, the `LIVE_QUERY_ERROR` symbol and the tagged status objects are deleted; `useLiveQuery` is retired for catalog and player data (`dexie-react-hooks` is dropped once no caller remains).
- Unit-name resolution and the unit-power context read the shared cache and expose referentially stable values, removing the `exhaustive-deps` disables that exist only because they returned new closures.
- The two sync providers and the two manifest-sync loops collapse into one generic engine and one provider component parameterised by source; in-flight deduplication comes from the query client rather than module singletons. The engine downloads changed datasets/chunks with bounded concurrency (4) — moved here from `tune-client-query-caching` — and the sync code (HTTP client + schemas) is loaded through new `./sync` package subpaths only when a sync runs — moved here from `trim-startup-bundle` — so the loop is rewritten once.
- No change to what pages show. Per-page loading, failure, empty and unavailable states keep their existing specs; the new behaviour is the bounded wait, the retry and the cross-tab refresh.

## Capabilities

### New Capabilities

- `local-data-read-state`: how locally stored catalog and player data is read by the app: once per dataset per session, refreshed after a sync (in all open tabs), with a bounded wait before a read is reported as failed and offered a retry.

### Modified Capabilities

- none — existing page specs already describe their loading and failure presentation; this change supplies the read states those presentations consume.

## Impact

- New `apps/web/src/fsd/shared/local-data` (read hooks over the query client, timeout, read-state combinators); `shared/lib/use-read-state.ts` reimplemented over the query client; `entities/legendary-event/model/use-query-read-state.ts` moves to `shared/lib`.
- `app/providers/game-catalog-provider.tsx`, `player-data-provider.tsx` (merged into one provider), `packages/game-catalog/src/game-catalog-sync.ts`, `packages/player-data/src/player-data-sync.ts` (one shared loop).
- Every `useLiveQuery` consumer under `pages/*`, `entities/legendary-event`, `shared/unit-name`, `shared/unit-power`, `features/*`, `app/layout` (`use-nav-items.ts`, `hse-live-provider.tsx`); `apps/web/package.json` drops `dexie-react-hooks`.
- Tests: the 50 test files mocking `dexie-react-hooks` and the 47 mocking `@workspace/game-catalog/queries` by deep path. Depends on `test-harness-render-app` (page tests render against `fake-indexeddb` instead of module-path mocks) landing first.
- Owns every edit to the two sync loops: download concurrency (from `tune-client-query-caching`) and the `./sync` subpaths (from `trim-startup-bundle`) land here; those changes no longer touch `game-catalog-sync.ts` / `player-data-sync.ts`. Lands after `tune-client-query-caching` and before `rebuild-foundation-pre-launch` / `rehome-feature-logic`. No companion `tacticus-planner-api` change.
- `KNOWN_ISSUES.md` drops the stuck-loading entry; `tacticus-planner-docs/architecture/frontend.md` needs the read-layer description (separate docs change).
