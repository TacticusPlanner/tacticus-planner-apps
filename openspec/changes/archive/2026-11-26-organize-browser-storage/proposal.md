## Why

The web app keeps about 60 keys in browser storage under five naming styles (`tp.dailies.arena.mode`, `collection.view`, `home-live-event-count`, `raids-filters.v1`, `tp:stale-reload:`), each declared next to its feature, with no list of what is stored and nothing stopping a new raw `localStorage` call. Most preference hooks also kept a private copy of the value, so two readers of one preference on a page drifted apart. Account data sat under `tp.session.`, which reads like `sessionStorage` in devtools, and dead keys from removed features stayed forever.

## What Changes

- One key registry (`shared/lib/browser/storage-keys.ts`); `safeStorage` and the new `safeSessionStorage` accept only registered keys, and an ESLint rule rejects direct `localStorage` / `sessionStorage` use outside `safe-storage.ts` and tests.
- Per-device preferences grouped into one JSON record per feature (`tp.nav`, `tp.collection`, `tp.teams`, `tp.progress`, `tp.goals`, `tp.dailies`, `tp.guildWar`, `tp.home`, `tp.legendaryEvents`, `tp.dismissed`), read through one `useStoredPreference` hook that keeps every reader in sync across the page and tabs.
- Account data moves from `tp.session.*` to `tp.user.*`; collapsed Goals sections (they hold project ids) move under it too. Version suffixes are dropped.
- Session keys renamed to `tp.nav.lastVisitedChild` and `tp.staleReload.<url>`.
- `migrateStorage()` runs first at every start and moves every old key; dead keys (Arena, project detail grouping, beta promo, the old redirect marker) are deleted, and the expired beta promo tile is removed.
- Unbounded data capped: 200 collapsed Goals sections, 10 events of Legendary event token reports (now one record).
- PostHog keeps its state in `localStorage` only, so it no longer sets a cookie on the parent `tacticusplanner.app` domain.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `browser-storage-resilience`: one registry, lint guard, naming scheme, records, startup migration, removed keys.
- `redirect-authentication`: the account prefix is `tp.user.`.
- `quest-event-tracker`: the progress key name.
- `daily-raids-filters`: the stored filters scenario no longer names the old key.

## Impact

- `apps/web/src/fsd/shared/lib/browser/` (`storage-keys.ts`, `stored-preference.ts`, `storage-migration.ts`, `safe-storage.ts`, `use-persisted-selection.ts`), `main.tsx`, `eslint.config.js`, every storage caller, and their tests.
- Removes `pages/home/model/beta-promo.ts`, `pages/home/ui/right-now/beta-promo-tile.tsx`, `features/legendary-event-tokens/model/use-stored-open.ts` and the `home.betaPromo` strings.
- No API change. V1's Google Analytics cookies are unaffected (V1 keeps GA).
