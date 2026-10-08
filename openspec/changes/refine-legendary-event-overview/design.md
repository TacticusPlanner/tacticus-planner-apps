# Design

## D1. Objective cleared counts come from `LaneProgressView`

`BattleProgressView.cleared[k + 1]` already says whether objective `k` (catalog `index` order) is cleared in battle `k`. A small pure helper `objectiveClearedCounts(progress: LaneProgressView, objectives): number[]` in `entities/legendary-event/lib/synced-lane-progress.ts` returns, per lane objective, the number of battles with that flag set; `noLane` yields zeros. The lane summary and the chip counts both read it, so the two figures cannot disagree. Denominator: `progress.battles.length` (the lane's battle count), the same as the battles line.

## D2. One controls component, grouped chips

`LeaderboardControls` takes `groups: readonly ObjectiveChipGroup[]` (`{ laneId, chips }`), built by `useObjectiveChips()(lanes)` which now returns one group per lane (no cross-lane de-duplication). A `ToggleGroupItem`'s `value` stays the objective's `objectiveFilterKey`, so the same objective in two lanes is one filter entry that shows as pressed in both groups; the React key is `laneId:key`. The heading is rendered only when there is more than one group, so the lane tabs keep their single unlabeled row. Counts are attached to the chips at build time (`count?: { cleared, total }`) from the `ProgressGridViewModel` when it is ready and the lane is not `noLane`-less (a `noLane` lane shows `0 / total`); when the grid read failed the chips carry no count.

## D3. Cross-lane indicators reuse `ObjectiveIndicator`

`CrossLaneLeaderboardRow.satisfiedKeys` already lists every satisfied objective key across the lanes the unit is allowed on, and an objective's satisfaction is a unit property, so `met = satisfiedKeys.includes(objectiveFilterKey(objective.filter))` is exact per lane. Each lane cell renders the lane's chips (same `ObjectiveChip` list the controls use) through the existing `ObjectiveIndicator`, in a compact `size-4` variant, above the figure; the table keeps its three lane columns and the list keeps one line per lane.

## D4. Trait markers are a `LeaderboardUnit` concern

`LEADERBOARD_TRAIT_MARKERS = ["Healer", "Mechanic"]` in `leaderboard-parts.tsx`; `LeaderboardUnit` renders `traitIcon(trait)` for each marker present in `row.unit.traits`, `size-4`, with `title` and `sr-only` text from the `traits` namespace. Table and list variants both pass through `LeaderboardUnit`, so there is one implementation.

## D5. Nav children and most-specific resolution

`useNavItems()` builds `[allEvents, ...active, ...upcoming, ...archived]` from `orderLegendaryEventsForHub`, mapping the lifecycle to `legendaryEvents.tabs.{active,upcoming,archived}EventDescription`. Because All events (`/legendary-events`) is now first and prefix-matches every event route, `resolveActiveNavigation` picks the matching child with the longest path instead of the first match. `useSectionEntryPath` and the landing-page rules are unchanged: All events is still the only `isLandingPage` child.
