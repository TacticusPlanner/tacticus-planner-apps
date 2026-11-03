## Context

V1: `svehera/tacticusplanner` `src/fsd/1-pages/input-roster-snapshots` (about 3.8k LOC, route `input/roster-snapshots`). V2 already has the Collection page (`pages/my-game`, capability `player-collection`), `UnitTile` (`entities/unit`), combat power (`character-combat-power`, `unit-power`), and LE run-history deltas (`pages/legendary-events/lib/run-history.ts`), which compare a run record's roster with the current one for unlock, stars, rank and ability increases.

Companion API change: `add-personal-roster-snapshots`. Shared contract: `GET/POST me/roster-snapshots`, `GET/PATCH/DELETE me/roster-snapshots/{id}`, `RosterSnapshotResponse`, and the errors `rosterSnapshotLimitReached` and `playerDataNotSynced`, plus the upstream sync errors.

## Goals / Non-Goals

**Goals:** V1's take/compare/manage workflow, redesigned around a summary and changed units, living inside Collection; one diff model shared with LE history.

**Non-Goals:** automatic snapshots, Keep and the V1 import UI (`add-automatic-roster-snapshots`); filters by Guild War, raid, TA or horde teams (V2 has no general Teams yet); sharing a diff as an image; per-unit timelines.

## Decisions

1. **Owning slice: `entities/roster-snapshot`.**
   - Public API: `useRosterSnapshots()`, `useRosterSnapshot(id)`, `useCreateRosterSnapshot()`, `useRenameRosterSnapshot()`, `useDeleteRosterSnapshot()`, `diffRosters(from, to, catalog)`, `summarizeRosterDiff(diff)`, and types `RosterSource`, `UnitDiff` and `RosterDiffSummary`.
   - Both Collection and the LE page consume it, and neither imports the other.
   - Snapshot bodies are immutable, so `useRosterSnapshot(id)` uses `staleTime: Infinity`. The list is invalidated on create, rename and delete.
2. **One canonical diff, with the summary derived from it.** `diffRosters` returns one `UnitDiff` per unit owned on either side. The summary, the chips, the popover and LE `rosterDeltas` all project from that result. LE keeps its narrower rules (increases only, applied upgrades ignored) as a projection, not a second calculation.
3. **Shards spent.** For each progression step crossed between `from` and `to`, add the step's shard cost (and mythic-shard cost) from the catalog `progression-rules` data, plus the unlock cost when the unit was unlocked in between. Then `earned = to.shards − from.shards + spent`.
4. **Compare is a mode of Collection, not a route.**
   - `?compare=<id>|latest&to=current|<id>` sits alongside Collection's existing query params and follows the same rules: replace history, drop invalid values, omit defaults.
   - `compare` absent means normal Collection. `compare=latest` is what the toggle writes; it is resolved after the list loads.
   - Ids are personal snapshot ids, or `le:<eventId>:<recordId>` for run records.
5. **List shape in compare mode.** A flat list of owned-on-either-side units sorted by power gain (descending), then name. It is not grouped by faction, because the comparison is about the biggest changes, not about where units belong. The Sort control still offers Collection's sorts, applied to the "to" state.
6. **Desktop vs mobile.**
   - Desktop: summary card above the list; tile grid with chips; popover on hover/click; pickers and fields inline in the toolbar.
   - Mobile (<768px): summary as a horizontal chip strip; one row per unit (portrait, name, chips); detail opens in a bottom sheet; pickers and fields live in a "Compare options" bottom sheet.
   - Tour targets differ, so desktop and mobile get separate tour steps.
7. **Fields setting** is a multi-select (shards, mythic shards, XP, upgrades, abilities, equipment, power), all on by default. It is remembered in localStorage with try/catch, and is not in the URL. It hides chips and popover rows only, never units.
8. **Take flow.**
   - The take dialog calls `POST` (sync and capture) and shows "Syncing…".
   - On a sync error, it shows the error with "Take from last sync (synced <relative>)" (`fromLastSync=true`) and a Retry. On 429 it shows the retry time.
   - At the limit, the button is disabled with a tooltip; a 409 is handled the same way.
   - On success it shows a toast with a Compare action, and refreshes player data.
9. **Read-only LE rosters in the picker** come from the existing run-record list and roster endpoints. They are grouped under "Legendary Events", labeled "<event> · run <n> · <date>", and cannot be renamed or deleted.

## V1-parity checklist

| V1 element | Decision |
|---|---|
| Route `input/roster-snapshots`, standalone page with its own menu item | **Redesign**: compare mode inside Collection; no new nav item |
| Take Snapshot dialog (required unique name, default "Snapshot <date>") | **Redesign**: name optional, default date, duplicates allowed |
| Manage dialog: rename, delete to trash, restore, delete all, empty trash | **Keep** rename and delete; **drop** trash, restore and delete all (hard delete with confirm) |
| 20-snapshot cap including trashed, with tooltip | **Keep** 20 (live only) with "12/20" usage and a disabled-button tooltip |
| "Active / Deleted snapshots" counter line | **Redesign**: "12/20" in the take dialog and manage sheet |
| Left / Right selects, right defaults to Current | **Keep**, plus LE run-record rosters as read-only sources |
| No snapshots: roster shown sorted by power | **Redesign**: normal Collection, plus an empty-state prompt in compare mode |
| Side-by-side and Detailed diff styles | **Drop**: one tile with chips plus a detail popover |
| 8 Never/WhenNonZero/Always settings | **Redesign**: one fields multi-select |
| Team / team-category filters (GW off/def, raid, TA, horde) | **Defer**: no V2 Teams yet |
| LE event × track filter | **Keep**, as a Collection filter in compare mode |
| Zoom slider | **Drop**: Collection density and the mobile rows cover it |
| `fixSnapshot` legacy star repair | **Drop** here; handled by the API V1 import |
| Tooltips on unit portraits | **Redesign**: detail popover (desktop) or bottom sheet (mobile) |
| V1 asset and icon ids reused | Collection's existing V2 unit portraits and rarity/rank icons; no V1 assets |

## Risks / Trade-offs

- A flat list in compare mode departs from Collection's faction grouping. It's justified by "biggest change first", and it's revisitable.
- Power for every unit on both sides costs about 2 × 150 calculations per render; memoize per (snapshot id, unit).
