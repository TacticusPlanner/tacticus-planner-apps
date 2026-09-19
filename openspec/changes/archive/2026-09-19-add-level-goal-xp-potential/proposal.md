## Why

Level goals were the odd kind out in the Goals list: every other costed goal kind (Rank, Ability, Ascension) shows a "Potential progress" indicator — how far the goal could advance right now if already-owned resources were applied, after higher-priority goals in the project reserve their share — but a Level goal only ever showed its raw level count in the Remaining column, with no XP figure and no Potential indicator at all, even though the account's XP-book inventory is exactly the kind of already-owned, shareable resource Potential progress exists to surface. This closes that gap: Level goals now report the XP still needed alongside the level count, and compute a Potential ratio from the account's owned XP books, shared across a project's Level goals by priority the same way Rank/Ascension already share upgrade materials and orbs.

## What Changes

- Extend the Remaining column's per-goal-kind formatter for a Level goal to append the XP still needed (raw, not netted against owned books — mirrors how a Rank goal's Remaining column shows the raw slot count) whenever it's nonzero: `"{{count}} levels · {{xp}} XP"`, falling back to `"{{count}} levels"` when already-earned partial XP fully covers the gap.
- Compute a Level goal's Potential progress ratio from the account's owned XP books, netted against every Level goal in the same project in priority order — a higher-priority goal's allocation is computed first and the books it spends are removed from the shared pool before the next goal's allocation runs, so two Level goals never double-count the same books. Applying an XP book is all-or-nothing (matches the game and the existing goal-creation cost preview's own netting logic), so a goal's leftover XP within a spent book counts only toward that goal.
- Extend the existing Actual/Potential explanation popover to carry a Level goal's own remaining-levels and remaining-XP clauses, mirroring the existing Rank goal's remaining-slots/remaining-energy clauses.
- Update the "Actual Progress and Potential Progress captions carry a visible explanation" requirement's stale assumption (it previously said only Rank/Ability/Ascension compute a Potential ratio) to include Level.

## Capabilities

### Modified Capabilities

- `goal-progress-display`: extends the per-goal-kind Remaining-text formatter to include XP for Level goals; adds a Potential-progress requirement for Level goals sourced from owned XP books, priority-shared across a project's Level goals; extends the Actual/Potential explanation popover's per-kind remaining-count clauses to Level; updates the stale "only Rank/Ability/Ascension compute both ratios" assumption.

## Impact

- `apps/web/src/fsd/features/goal-farming/lib/level-xp-cost.ts` — `netXpAgainstOwnedBooks` refactored into a `consumeOwnedBooks` primitive that also returns the updated book pool (for allocating the same pool across several goals); new `maxLevelReachableWithXp` (the inverse of `xpNeededForLevelRange`, walking candidate levels to find how far a given amount of XP reaches).
- `apps/web/src/fsd/pages/goals/model/attainment/goal-progress.ts` — the `Level` `GoalProgress` variant gains `remainingXp: number | null`, computed via `xpNeededForLevelRange` from the character's true current level/XP.
- `apps/web/src/fsd/pages/goals/model/insights/level-potential-allocation.ts` (new) — `buildLevelGoalNeeds`/`allocateXpBooksAcrossGoals`, mirroring the existing `orb-potential-allocation.ts`'s shape for Ascension's alliance-orb sharing.
- `apps/web/src/fsd/pages/goals/model/insights/plan-insights-calc.ts` — `computePlanInsights` gains an `inventoryXpBooks` param and a Level branch in its `potentialProgressByGoalId` computation.
- `apps/web/src/fsd/pages/goals/model/insights/use-plan-insights.ts` — fetches the account's XP-book inventory (`getInventoryXpBooks`) alongside the upgrade/orb inventory already fetched for the project Insights pipeline.
- `apps/web/src/fsd/pages/goals/ui/shared/goal-remaining-text.ts` and `goal-progress-visuals.tsx` — the Level Remaining-text formatter and the explanation popover's per-kind clauses.
- `apps/web/public/locales/{en,de,es,fr}/common.json` — new/changed keys for the XP-inclusive Remaining text and the popover's Level-specific clauses.
- No companion `tacticus-planner-api` change — client-only, over already-synced XP-book inventory data no other change alters.
