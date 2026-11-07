# Tasks

## 1. Contract

- [x] 1.1 `pnpm --filter web api:pull <merged API SHA>` covering `add-automatic-roster-snapshots` and `import-v1-roster-snapshots`.

## 2. Entity

- [x] 2.1 `snapshotLabel` (source-aware, localized date with year) and the Auto badge.
- [x] 2.2 `useKeepRosterSnapshot`, plus the auto usage fields on the list.
- [x] 2.3 `diffRosters`: XP and applied upgrades are unknown when either side is `V1Import`. Add tests.

## 3. UI

- [x] 3.1 Manage sheet Automatic section: usage, replacement note, Keep (disabled at the limit with a tooltip).
- [x] 3.2 No user setting for automatic snapshots (the `RosterSnapshots` flag is the off switch).
- [x] 3.3 V1 import: Roster snapshots checkbox, part status and grouped outcomes.

## 4. i18n and analytics

- [x] 4.1 Keys for labels, the Automatic section, Keep and the V1 import part/outcomes, in en/de/es/fr with real translations.
- [x] 4.2 Analytics events for Keep.

## 5. Verification

- [x] 5.1 Vitest for labels, Keep, unknown fields and V1 import outcomes. `pnpm typecheck`, `pnpm lint`, `pnpm lint:fsd`.
- [ ] 5.2 Browser check through the Aspire stack: automatic snapshot after a sync, Keep, and a V1 import with snapshots.
