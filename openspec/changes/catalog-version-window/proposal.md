# Proposal

## Why

Game updates reach players over days. When the planner moves to a new catalog, players whose game has not updated yet get plans for a game they are not playing. In the 1.43.157.2989 → 1.44.87.3088 bump:

- the quest events rotated (Cyrus, Sternguard and Sekhetar out; Daras, Weirdboy and Parasite in);
- 11 NPCs changed stats;
- 16 of 31 served datasets moved.

The API now serves the latest and the previous release side by side. The client has to let each player choose which one to plan with, keep both usable offline, and tell players when a new release arrives.

Companion API change: `catalog-version-window` in `tacticus-planner-api` (it serves both releases, the versions list, the manifest `gameVersion` parameter, and the `catalogVersion` setting). That half applies first.

## What Changes

- **Selected release.** The client plans with one _selected_ catalog release.
  - Signed-in players: it comes from `GET settings` (`effectiveCatalogVersion`) and is saved with `PUT settings` (`catalogVersion`).
  - Guests: it is kept in browser storage.
  - The default is `Latest`.
- **One IndexedDB catalog per game version.** Each catalog is named after its game version, e.g. `tacticus-planner-game-catalog-1.44.87.3088`.
  - Only the selected release is synced at start. Another is downloaded the first time it is selected.
  - Switching between already-synced releases is instant and works offline.
  - At start the client deletes catalogs for game versions the API no longer serves, and the legacy unversioned catalog once a versioned one is complete.
- **All catalog reads follow the selected release.** Every estimate, raid suggestion, Legendary Event plan, quest and lookup recomputes on a switch.
- **"Game data" row in the account card's Preferences section** (desktop popover, mobile drawer and guest menu). It opens an in-card picker listing "Latest (1.44.87)" and the previous release ("1.43.157"). The catalog footer shows the selected version.
- **A pin that left the window falls back to Latest.** When the API rolls the window past a player's pin, the client uses Latest and shows a one-time notice.
- **New-release banner, for every visitor.**
  - It appears when the latest game version differs from the last one the visitor saw.
  - Players on Latest get "updated to 1.44 — switch back if your game is still on 1.43".
  - Players on the previous release get "1.44 is available — switch".
  - It can be dismissed per release.
- **Ids missing from the selected release render gracefully.** Roster units, goals and local progress can name ids that release lacks (Daras while on 1.43). These render with a fallback name and icon instead of failing.
- **Generated game text and sprites cover both releases.**
  - Generators read both pinned data-mines releases and write the union, with the latest release winning where both have an id.
  - Sprites come from the latest release, or the previous one when only it has the file.
  - `apps/web/datamine/REF` becomes two pins, `latest` and `previous`, matching the API.

No **BREAKING** changes: the API defaults keep today's behaviour until this client ships.

## Capabilities

### New Capabilities

- `catalog-version-selection`: which release the client plans with, where the choice is stored, per-version IndexedDB catalogs and their sync and cleanup, the fallback when a pin leaves the window, and rendering ids the selected release lacks.
- `catalog-release-banner`: the new-release banner, its audience, copy, actions and dismissal.

### Modified Capabilities

- `account-menu`: the Game data row and picker in Preferences; the footer names the selected version.
- `datamine-source`: two pins instead of one; caches, sprites and name namespaces from both releases.
- `ability-rules-text`: rules text covers abilities from either release; a refresh drops an ability only when neither release has it.

## Impact

- **`packages/game-catalog`:**
  - Version-named Dexie databases (`game-catalog-storage.ts`);
  - the manifest fetch with `gameVersion` (`game-catalog-api.ts`);
  - sync per release (`game-catalog-sync.ts`);
  - a `listGameCatalogVersions` client;
  - query keys that carry the game version.
- **`apps/web/src/fsd/app/providers/game-catalog-provider.tsx` and `game-catalog-init-gate.tsx`:** resolve the selected release before syncing.
- **`shared/local-data`** (`use-local-data.ts`, `refresh-after-sync.ts`): reads and cross-tab refresh scoped to the selected release.
- **Settings:** `entities/planning-setting` (settings queries and mutation) and `shared/api/schema.d.ts` from the regenerated OpenAPI.
- **`widgets/account-menu`:** `account-menu-parts.tsx`, `account-card.tsx`, `guest-account-menu.tsx` and `catalog-sync-status-badge.tsx`.
- **The banner:** a new feature slice, mounted in the app shell.
- **Generators and data:** `apps/web/scripts/datamine.mjs`, the three i18n generators and `datamine-sprites.mjs`; `apps/web/datamine/{REF,files.txt,sprites.txt}`.
- **Locales:** `public/locales/*` gets new `common`/account keys in en, de, es and fr.
- **Storage:** IndexedDB holds up to two catalogs, a few MB each.
