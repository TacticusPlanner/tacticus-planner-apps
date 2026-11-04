# Tasks

## 1. Contract

- [ ] 1.1 `pnpm --filter web api:pull <merged API SHA>` covering `add-automatic-roster-snapshots` and `import-v1-roster-snapshots`.

## 2. Entity

- [ ] 2.1 `snapshotLabel` (source-aware, localized date with year) and the Auto badge.
- [ ] 2.2 `useKeepRosterSnapshot`, plus the auto usage fields on the list.
- [ ] 2.3 `diffRosters`: XP and applied upgrades are unknown when either side is `V1Import`. Add tests.

## 3. UI

- [ ] 3.1 Manage sheet Automatic section: usage, replacement note, Keep (disabled at the limit with a tooltip).
- [ ] 3.2 Settings toggle for `autoRosterSnapshots`.
- [ ] 3.3 V1 import: Roster snapshots checkbox, part status and grouped outcomes.

## 4. i18n and analytics

- [ ] 4.1 Keys for labels, the Automatic section, Keep, the setting and the V1 import part/outcomes, in en/de/es/fr with real translations.
- [ ] 4.2 Analytics events for Keep and the setting change.

## 5. Verification

- [ ] 5.1 Vitest for labels, Keep, unknown fields and V1 import outcomes. `pnpm typecheck`, `pnpm lint`, `pnpm lint:fsd`.
- [ ] 5.2 Browser check through the Aspire stack: automatic snapshot after a sync, Keep, toggle off, and a V1 import with snapshots.
