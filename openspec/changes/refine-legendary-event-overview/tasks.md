# Tasks

## 1. Entity helper

- [x] 1.1 Add `objectiveClearedCounts(progress, objectives)` to `entities/legendary-event/lib/synced-lane-progress.ts` (design D1), export it from the entity index, and cover the lane-summary fixture's 11 / 11 / 10 / 7 / 8 counts and the `noLane` zeros in `synced-lane-progress.test.ts`.

## 2. Overview lane summary

- [x] 2.1 Add the objectives row to `overview/lane-summary.tsx` (`lane-summary-objective` per objective with icon, `laneSummary.objectiveCleared` text and a `Progress` bar in `--event-legendary`), passing the event so the lane objectives are known; cover the counts, the `noLane` zeros and the unavailable body in `lane-summary.test.tsx`.

## 3. Leaderboard controls

- [x] 3.1 Change `useObjectiveChips` to return `ObjectiveChipGroup[]` with optional counts from the progress grid (design D2) and `LeaderboardControls` to render one labeled group per lane (`leaderboard-objective-group` data-lane, heading only when several groups) with the `cleared / total` suffix (`leaderboard-objective-count`); thread `progressGrid` from the page view into `LeaderboardSection` and `CrossLaneLeaderboard`.
- [x] 3.2 Update `leaderboard.test.tsx` and `cross-lane-leaderboard.test.tsx`: the Overview chips are grouped Alpha / Beta / Gamma, a shared objective appears in each lane's group and toggles together, chips carry counts when progress is ready and none when it failed.

## 4. Cross-lane indicators

- [x] 4.1 Render per-lane `ObjectiveIndicator`s in `CrossLaneTable` and `CrossLaneList` lane cells (design D3), none for a disallowed lane; cover Dante's met / not-met indicators per lane in `cross-lane-leaderboard.test.tsx`.

## 5. Trait markers

- [x] 5.1 Add Healer / Mechanic markers to `LeaderboardUnit` (design D4, `leaderboard-trait` data-trait) and cover a Healer unit and a unit without the traits in `leaderboard.test.tsx`.

## 6. Navigation

- [x] 6.1 Change `use-nav-items.ts` to list All events first then every event in hub order with lifecycle descriptions (design D5), add `legendaryEvents.tabs.upcomingEventDescription` / `archivedEventDescription` to `common.json` en/de/es/fr, make `resolveActiveNavigation` pick the most specific matching child, and update `use-nav-items.test.tsx` and `resolve-active-navigation.test.ts` (an archived event's detail route activates that event's child).

## 7. Copy

- [x] 7.1 Add `laneSummary.objectives`, `laneSummary.objectiveCleared`, `leaderboard.objectiveCount`, `leaderboard.laneObjectives` and `leaderboard.trait` keys to `legendaryEvents.json` en/de/es/fr with real translations; verify the translations parity test passes.

## 8. Verification

- [x] 8.1 `pnpm --filter web test:run`, `tsc -b --noEmit`, `eslint`, `knip`, `steiger`, `prettier` all pass; the app-navigation, hub and eligibility delta specs match the shipped behaviour.
