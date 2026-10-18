# Tasks

## 1. Potential model (entities)

- [x] 1.1 Add `laneRosterPotential(lane, roster, estimates, progress)` in `entities/legendary-event/lib/roster-potential.ts` returning per-row potential depths, potential points left (via `laneReachablePoints`), the falls-behind battle and uncovered objectives; unit tests for the Uthar Alpha worked example (1,386 of 8,745), too few units, nothing owned and estimates unavailable
- [x] 1.2 Add `potentialCellStates(...)` applying the cleared > teams reach > roster can > out of reach precedence; tests for the worked map

## 2. Lane overview UI

- [x] 2.1 Replace the ladder in `lane-overview.tsx` with a `RosterPotentialMap` (grid, legend, summary lines, column labels/tooltips, skeleton and unavailable states); update `lane-overview.test.tsx`
- [x] 2.2 Mobile: tap-to-popover column labels, every-third battle numbers, no horizontal scroll at 320px
- [x] 2.3 Overview lane summary: "Roster reaches battle D" per lane

## 3. i18n and tour

- [x] 3.1 `legendaryEvents` keys in en/de/es/fr (legend, summary lines, column label, unavailable); remove `laneOverview.ladder` / `battlePoints` if unused
- [x] 3.2 Update the lane overview tour step copy in all four locales

## 4. Verification

- [x] 4.1 `pnpm --filter web lint`, `typecheck`, `vitest run`
- [ ] 4.2 Desktop and mobile check of a lane tab through the Aspire stack (map, tooltips/popover, legend, no horizontal scroll)
