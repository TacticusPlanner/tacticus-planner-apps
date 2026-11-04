## Why

V1's Roster Snapshots page lets players save their roster and see what changed. It gets about 10k views from 5.4k users every 90 days, and V2 has nothing like it. This change brings it to V2 as a **compare mode inside Collection** rather than a separate page. It redesigns what didn't work in V1:

- a summary comes first, instead of a wall of tiles;
- only changed units show by default;
- shard changes account for shards spent on promotions;
- XP, upgrade and power deltas are new;
- one diff tile replaces two diff styles and eight tri-state settings;
- mobile gets a real row layout;
- the compare state lives in the URL.

Planning and decisions are in the project's `roster-snapshots/exploration.md`.

Companion API change: `add-personal-roster-snapshots` in `tacticus-planner-api` (the `me/roster-snapshots` resource with sync-and-capture, list, read, rename and delete). The API half applies first. Follow-up apps change: `add-automatic-roster-snapshots`.

## What Changes

- **`entities/roster-snapshot`** (new): TanStack Query hooks for list, read, create (sync and capture, with the explicit "from last sync" fallback), rename and delete. Types are aliased from the generated schema.
- **One diff model** in `entities/roster-snapshot` compares two rosters (a snapshot or Current) per unit. It covers unlocked, progression (rarity/stars), rank, applied upgrades, XP level and total XP, shards and mythic shards (net, spent and earned), each ability, equipment per slot, and power. It also builds the summary from the same result. The LE run history's `rosterDeltas` is refactored onto it, with no behavior change.
- **Collection compare mode**:
  - a Compare toggle in the toolbar, with `?compare=<id>&to=current|<id>` in the URL;
  - the default comparison is the latest snapshot vs Current;
  - a summary card whose metrics filter the list;
  - changed units only, unless "Show unchanged" is on;
  - default sort is biggest power gain;
  - tiles with change chips, plus a detail popover;
  - a fields multi-select remembered on this device;
  - Collection filters, quick filters and search keep applying, plus a new Legendary Event team/track filter.
- **Snapshot picker** lists personal snapshots and, read-only, Legendary Event run-record rosters.
- **Take and manage**:
  - a Take snapshot button in the toolbar, with an optional-name dialog, a "Syncing…" state, a sync-failure fallback and a success toast with a Compare action;
  - "12/20" usage shown;
  - a manage sheet with inline rename and delete-with-confirm;
  - deleting the compared snapshot falls back to the latest.
- **Mobile**: one row per unit with chips, a horizontally scrolling summary strip, and the pickers and fields in a bottom sheet.
- Guests see an upsell instead of the take and compare controls.
- Tour steps, i18n (en/de/es/fr) and analytics events.

## Capabilities

### New Capabilities

- `roster-snapshot-diff`: the canonical per-unit diff and the summary derived from it.
- `collection-snapshot-compare`: compare mode in Collection, including the URL state, summary, list, tiles, filters, fields setting and mobile layout.
- `roster-snapshot-management`: taking, listing, renaming and deleting snapshots, and the picker sources.

### Modified Capabilities

<!-- legendary-event-run-history keeps its requirements; only its implementation moves onto the shared diff model. -->

## Impact

- `apps/web/src/fsd/entities/roster-snapshot` (new): API hooks, diff model and summary.
- `apps/web/src/fsd/pages/my-game/ui/collection/*` and `model/*`: compare mode, toolbar buttons, tiles, summary and dialogs.
- `apps/web/src/fsd/pages/legendary-events/lib/run-history.ts`: `rosterDeltas` now delegates to the entity.
- `apps/web/openapi/*` and `shared/api/schema.d.ts`: pulled from the merged API SHA.
- `apps/web/public/locales/{en,de,es,fr}/common.json`: new `collection.compare.*` and `collection.snapshots.*` keys, plus tour keys.
- Collection tutorial: new compare and take steps on desktop and mobile.
