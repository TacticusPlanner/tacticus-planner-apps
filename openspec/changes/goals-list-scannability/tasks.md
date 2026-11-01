# Tasks

## 1. Layout

- [x] 1.1 Split "Status · Done by" into Status and Done by columns; move Progress last at a narrow width; taller rows.
- [x] 1.2 Larger avatars, rank/rarity emblems (`GoalTargetDisplay size="lg"`, `ProgressionBadge size`), status chips and resource chips.
- [x] 1.3 Mobile: larger avatar and emblems; one-line Done by caption at body size with the date emphasised.
- [x] 1.4 `goals.columns.doneBy` and the shortened `goals.columns.status` in en/de/es/fr.

## 2. Tests

- [x] 2.1 `goals-list.test.tsx`: column headers/order, cell counts, desktop stacked vs mobile one-line estimate.

## 3. Gates

- [x] 3.1 Targeted vitest (`pages/goals`, `shared/ui`), `tsc`, eslint on changed files, `pnpm lint:fsd`.

## Desktop verification

- [x] 4.1 Rendered table snapshot at 1400px (Active with estimate, Paused without, Ascension goal): columns in order, date/day lines, chips readable.
- [ ] 4.2 Live check on staging with a populated account (several Active/Paused goals across projects).

## Mobile verification

- [x] 5.1 Rendered card snapshot at 400px.
- [ ] 5.2 Live check on staging below 768px.
