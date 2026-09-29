## Why

`surface-goal-farming-guidance` added an XP-book rarity setting to Planning Settings, but changing it has no visible effect anywhere a user actually looks: the book-equivalent count is computed correctly (`xpBookEquivalent`) but is only threaded into the single-goal detail sheet's tiny text suffix, never into the Goals overview list, mobile cards, or project detail rows where the setting's effect would actually be seen. Separately, the count shown there (a bare "shortfall" figure) doesn't answer the question a user actually has when scanning a prioritized goal list: "does my current book stock cover this goal, and by how much?" V1's goal cards answered that with an available/needed book count per goal, matching a running priority-ordered pool. V2 should restore that visibility using its existing, already-correct priority-ordered allocation engine.

## What Changes

- Extend `allocateLevelXp` to also expose, per goal, the raw XP value of the shared owned-book pool as it stood at that goal's turn in priority order (before that goal's own consumption) — the one new piece of domain data; everything else here is display.
- Add an available/needed XP-book count per Rank/Ability goal, expressed in the user's selected XP-book rarity: `available = floor(poolXp / bookValue)`, `needed = ceil(chargedXp / bookValue)` (`chargedXp` already excludes levels a higher-priority goal of the same unit already covers). Both derived from raw XP, not from already-rounded book counts, to avoid compounding rounding error.
- Replace the existing "N additional books" shortfall text with this available/needed figure everywhere a goal's level requirement already renders remaining-XP text: the Goals overview table, mobile cards, project detail, and the goal detail sheet.
- The existing level-based Potential progress bar/percentage is unchanged: it already does not depend on the selected rarity, and this change does not introduce a second, competing percentage.

## Capabilities

### Modified Capabilities

- `goal-farming-guidance`: "Required-level guidance preserves raw XP and adds an equivalent" changes from an additional-books-needed figure to an available/needed figure, and starts rendering in the Goals overview list and mobile cards (previously detail-view only).

## Impact

- `apps/web/src/fsd/features/goal-farming/lib/level-xp-allocation.ts` (+ its domain re-export site `level-xp-cost.ts`): new field on `LevelXpAllocation`.
- `apps/web/src/fsd/pages/goals/model/insights/level-potential-progress.ts`: new per-goal map alongside `remainingXpByGoalId`.
- `apps/web/src/fsd/pages/goals/ui/shared/level-requirement-display.tsx`: `LevelRequirementRemaining` renders available/needed instead of shortfall.
- `apps/web/src/fsd/pages/goals/ui/goals-board/goals-list.tsx`, `goals-mobile-cards.tsx`, `goal-row-utils.ts` (`GoalsListProps`): thread the new per-goal values through, currently entirely absent.
- `apps/web/src/fsd/pages/goals/ui/goals-board/goals-page.tsx`, `apps/web/src/fsd/pages/goals/ui/projects/project-detail-page.tsx`: supply `xpBookRarity` (already read planning settings for the detail sheet; now also needed for the list) and the new per-goal maps to `<GoalsList>`.
- `apps/web/src/fsd/pages/goals/ui/goal-detail/goal-detail-header.tsx`, `use-goal-detail-metrics.ts`: swap shortfall for available/needed.
- Locale copy: replace/add `goals.overview.remainingText.additionalBooks` with an available/needed variant, in `en`/`de`/`es`/`fr` `common.json`.
- No API changes; purely frontend, no cross-repo companion.
