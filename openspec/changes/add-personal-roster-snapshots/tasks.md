# Tasks

## 1. Contract

- [ ] 1.1 `pnpm --filter web api:pull <merged API SHA>` for `add-personal-roster-snapshots`, and alias the generated types.

## 2. Entity `entities/roster-snapshot`

- [ ] 2.1 Query hooks: list, read (`staleTime: Infinity`), create (with `fromLastSync`), rename, delete. Invalidate the list and refresh player data on create.
- [ ] 2.2 Source model for personal snapshots and LE run-record rosters (`le:<eventId>:<recordId>`).
- [ ] 2.3 `diffRosters` and `summarizeRosterDiff`, including shards spent from progression rules and power through `character-combat-power`/`unit-power`. Vitest coverage for every worked example in `roster-snapshot-diff`.
- [ ] 2.4 Refactor LE `rosterDeltas` onto `diffRosters`. The existing LE run-history tests stay green, unchanged.

## 3. Collection compare mode

- [ ] 3.1 URL params `compare`/`to` in the collection query model: validation, fallback, replace-history.
- [ ] 3.2 Compare toggle; data states (loading, error, empty, no changes); guest prompt.
- [ ] 3.3 Summary card (desktop) and chip strip (mobile), with metric selection.
- [ ] 3.4 Flat list sorted by power gain; "Show unchanged"; existing sorts; LE event/lane filter.
- [ ] 3.5 Diff tile with chips and popover (desktop); row with bottom-sheet details (mobile); Library link.
- [ ] 3.6 Fields multi-select, persisted in localStorage with a fallback.
- [ ] 3.7 From/to pickers: inline on desktop, "Compare options" bottom sheet on mobile.

## 4. Take and manage

- [ ] 4.1 Take snapshot button and dialog: optional name, usage, "Syncing…", sync-failure fallback, 429 message, limit tooltip, success toast with Compare.
- [ ] 4.2 Manage snapshots sheet: inline rename, delete with confirm, fallback when the compared snapshot is deleted.

## 5. Tour, i18n and analytics

- [ ] 5.1 Update `collection.tutorial.tsx` with compare, summary and take steps, separately for desktop and mobile.
- [ ] 5.2 i18n keys `collection.compare.*`, `collection.snapshots.*` and `tour.collection.steps.*` in en/de/es/fr `common.json`, with real translations.
- [ ] 5.3 Declare and emit the analytics events (no snapshot names).

## 6. Verification

- [ ] 6.1 Vitest for the entity, URL model, compare page states and dialogs. `pnpm typecheck`, `pnpm lint`, `pnpm lint:fsd`.
- [ ] 6.2 Browser check through the Aspire stack: desktop and a 420px mobile viewport, take → compare → rename → delete.
