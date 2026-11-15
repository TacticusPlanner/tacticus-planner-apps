# Design

## Context

See proposal.md (Why). The current state:

- **Fetching.** `packages/game-catalog` fetches one manifest (`game-catalog-api.ts`, with an ETag) and syncs changed datasets (`game-catalog-sync.ts` via `runManifestSync`) into one Dexie database, `tacticus-planner-game-catalog` v19 (`game-catalog-storage.ts`).
  - `replaceGameCatalogDataset` clears and rewrites each store as soon as that dataset arrives; finalize records the manifest at the end.
  - So a sync that fails part-way leaves datasets from two releases side by side. That's harmless today and wrong once players switch releases.
- **When it syncs.** `app/providers/game-catalog-provider.tsx` runs the sync once per session. `game-catalog-init-gate.tsx` blocks first render during a download.
- **Reads.** They go through `useCatalogDataset(key)` (`shared/local-data/use-local-data.ts`, query key `["local","catalog",key]`) in 75 files, plus 9 modules importing `@workspace/game-catalog/queries` directly.
- **Cross-tab refresh.** `refreshLocalDataAfterSync` invalidates and broadcasts over a BroadcastChannel.
- **Settings.** They come from `GET`/`PUT /api/v1/settings` via `entities/planning-setting`. Guests keep preferences in `safeStorage`; keys prefixed `tp.session.` are cleared on sign-out.
- **Account card.** It lives in `widgets/account-menu`: `PreferencesSection` and `LanguagePickerView` in `account-menu-parts.tsx`, the footer `catalog-sync-status-badge.tsx`, and `guest-account-menu.tsx`.
- **Generated data.** Game text and sprites are generated at build time from one pin (`apps/web/datamine/REF`) through `scripts/datamine.mjs` `ensureDatamine()`. Their URLs carry no version.

Companion change: `catalog-version-window` in `tacticus-planner-api`. Shared contract:

- `GET game-catalog/versions` → `{ versions: [{ gameVersion, version, role }] }`;
- `GET game-catalog/manifest?gameVersion=`;
- content-addressed dataset URLs that resolve for both releases;
- `catalogVersion` / `effectiveCatalogVersion` on `GET`/`PUT settings`.

## Goals / Non-Goals

**Goals:**

- Switching between two synced releases is instant and works offline.
- A database never holds data from two releases.
- One place decides the selected release; every catalog read follows it.

**Non-Goals:**

- **Per-release generated text or sprites.** Both are a union (D6).
- **Showing two releases side by side** (a diff view).
- **Migrating local progress between releases.** Local progress is keyed by stable ids and simply keeps entries for ids the selected release lacks.

## Decisions

### D1. One Dexie database per game version, named by version, not by role

- The database name is `tacticus-planner-game-catalog-<gameVersion>`.
- `game-catalog-storage.ts` gains `openGameCatalogDb(gameVersion)`, a memoized map of open Dexie instances. Every database uses today's store schema; there's no shared global database.
- Each database's `metadata` store keeps its own manifest ETag. A `complete` marker is written only by finalize.
- **Why by version:** when the window rolls, the 1.44 database simply becomes "previous" without copying anything. A role-named design would have to move all of `latest` into `previous` on every release, while tabs are open.
- **Alternative: one database whose rows are keyed by `[gameVersion, id]`.** Rejected: every store and index changes, cleanup becomes per-row deletes, and the mixed-release failure mode remains.
- **Alternative: one database re-synced on every switch.** Rejected: every switch costs a download (16 datasets for 1.44), it doesn't work offline, and a partial failure mixes releases.

### D2. Lazy sync and completeness

- At start, the provider resolves the selected release, opens its database, and syncs it with `manifest?gameVersion=<v>`. The `Latest` selection omits the parameter and uses the version the manifest returns.
- Another release is synced only when it is first selected, by the switch flow (D4), with the existing progress UI.
- Reads from a database without the `complete` marker are not exposed to the app. The init gate treats an incomplete selected release exactly like today's first load.
- **Cleanup** runs after the versions list loads:
  - delete `tacticus-planner-game-catalog-*` databases not in the list (enumerated with `indexedDB.databases()`; skipped where unsupported);
  - delete the legacy `tacticus-planner-game-catalog` once the selected release's database is complete;
  - if the list request fails, delete nothing.
- The `stale-build` reload-once guard for a Dexie `VersionError` is reused unchanged for the per-version databases.

### D3. Where the selection lives (FSD)

- **`entities/catalog-release`**, a new slice:
  - `api/`: the `versions` query, key `["catalog-releases"]`, `staleTime` one hour.
  - `model/`: `useCatalogReleases()`, `useSelectedCatalogRelease()` and `resolveCatalogRelease(stored, window)`, a pure function returning the effective game version and whether a pin expired.
  - `lib/`: the device storage keys:
    - `tp.catalogRelease`: the guest choice, and for signed-in players the last-used hint;
    - `tp.catalogRelease.acknowledgedLatest`: for the banner.
  - These are deliberately not `tp.session.*`, so sign-out keeps them.
- **`shared/local-data`** gains a `CatalogReleaseContext` (`{ gameVersion }`), provided by the app layer.
  - `useCatalogDataset(key)` reads it and uses query key `["local","catalog",gameVersion,key]`.
  - The 9 direct `@workspace/game-catalog/queries` importers move onto the same context: they pass `gameVersion` into the query helpers, which now take it as their first argument.
  - Changing the context value therefore recomputes every catalog-derived view with no reload. Cached results for the other release stay warm, so switching back is instant.
- **`app/providers/game-catalog-provider.tsx`** wires it together: auth state + `entities/planning-setting` settings + `entities/catalog-release` → the context value, and sync of that release.
  - Signed-in: until settings load, it uses the device hint (D2), then reconciles with `effectiveCatalogVersion`.
- **`features/switch-catalog-release`**, a new slice:
  - `useSwitchCatalogRelease()`: sync the target release if it's incomplete, then save (signed-in: `PUT settings` with `catalogVersion` and the current revision; guest: device storage), then set the context.
  - It saves only after a complete download, so a failed switch changes nothing (spec: "Saving fails", "The download fails").
- **`widgets/account-menu`** uses the feature for the Game data row and picker (`CatalogReleasePickerView`, a sibling of `LanguagePickerView`).
- **`widgets/catalog-release-banner`**, a new slice, uses the feature for its action. It's a widget because it composes a feature with the release entity, and features must not import sibling features.
- The expired-pin notice is a Sonner toast, raised once by the provider when `resolveCatalogRelease` reports expiry.

### D4. Cross-tab consistency

- The BroadcastChannel message gains `gameVersion`. A tab invalidates only queries for that release.
- A selection change in one tab is broadcast as `{ type: "catalog-release", selection }`, so other tabs switch too. For signed-in players the settings query is also invalidated.

### D5. Ids missing from the selected release

- Display resolvers (`EntityIcon`, name lookups in `entities/unit`, `entities/upgrade`, …) already fall back for unknown ids in some places. They are made consistent:
  - the name comes from the generated namespace, which is a union (D6) and so usually has it, else the raw id;
  - the icon is the generic unknown sprite.
- Calculations iterate catalog records and look player data up by id, so a roster unit the release lacks is skipped naturally. The change audits the calculation entry points that iterate _player_ data instead (roster lists, goals) and filters ids with no catalog record before the math.

### D6. Generated text and sprites are the union of both pins

- **`apps/web/datamine/REF` becomes two lines**, `latest <tag> <sha>` and `previous <tag> <sha>`.
- **`scripts/datamine.mjs`:**
  - `ensureDatamine(release)` gives a cache per release (`node_modules/.cache/datamine/<release>`);
  - `pull <tag>` rolls the pins; `--refresh <release>` re-pulls one.
- **The three i18n generators:**
  - read both caches, compute each release's output as today, then merge per id with `latest` winning;
  - write files exactly as today, so loading, URLs and `i18next.d.ts` types are unchanged.
- **`datamine-sprites.mjs`:** for each listed path, copy from `latest`, else `previous`.
- **Why a union:** the client keeps one set of URLs; there's no versioned path per locale file.
- **Cost:** a reworded entry shows `latest` wording on the previous release. In 1.44 that's 6 NPC ability texts and 2 raid-boss texts, and only the wording; the numbers come from the API catalog datasets.
- **Alternative: versioned paths** (`/locales/<gameVersion>/…`). Rejected: it changes the i18next backend, the cache headers and the CI folder checks for a cosmetic gain.

### D7. Desktop and mobile

- **The account card:** desktop popover and mobile drawer already share one layout, so the Game data row and picker are the same component in both; no split.
- **The banner** renders in the shell below the global header. On desktop that's the header bar; on mobile it's the mobile top bar, full width, with its action and dismiss buttons stacked under the text when narrower than the header (`useIsMobile()`). The content and actions are the same in both.
- **Tour:** the shared-shell tour (`general.tutorial.tsx`) covers the account surface with one step per form (`accountMenu` on desktop, `accountDrawer` on mobile), not one per row. Both steps' text is updated to mention choosing the game data version; no new step or target is added. The banner is transient and gets no step.

## Risks / Trade-offs

- **[Two catalogs in IndexedDB.]** Up to two catalogs of a few MB each, with the 15 identical datasets stored twice → acceptable. Cleanup keeps at most the two served releases.
- **[`indexedDB.databases()` missing (older Firefox).]** → Cleanup only removes the databases it knows: the legacy one, plus the previous selection remembered in device storage. That covers the common case.
- **[Settings not yet loaded at start.]** → The device hint avoids a blocking wait. A mismatch causes one switch after settings load, from the other release's database if complete, otherwise a download.
- **[Direct query-module importers missed.]** → Changing the query helpers' signature to require `gameVersion` makes every missed call site a type error.
- **[Union text drift.]** → Documented above; numbers in panels come from catalog datasets that follow the selection.

## Migration Plan

1. **Ship after the API change is deployed.** The API defaults keep today's client working in the meantime.
2. **First start after deploy:**
   - the selected release is `Latest` (no stored choice) and syncs into `tacticus-planner-game-catalog-1.44.87.3088`;
   - the legacy database is deleted once that's complete, a one-time full download per visitor;
   - the banner records the current latest silently (first visit for this feature).
3. **Rollback:** the previous build re-creates the legacy database on its next start. Versioned databases are left behind until this build returns and cleans them.

## Open Questions

None. Release dates are not shown; the banner compares game versions only.
