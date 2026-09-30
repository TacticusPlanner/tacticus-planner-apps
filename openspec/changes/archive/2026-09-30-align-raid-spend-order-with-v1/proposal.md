## Why

Within a goal's daily turn, V2 spends energy on the cheapest node first, while V1 raids the materials that will take longest to finish first (`sortLocationsForRaiding`). For the same account, 538 energy per day and the same "By goals priority" setting, V1 finishes the Neurothrope goal (priority 1, about 1,410 energy, roughly 2.6 days of energy) in 3 days; V2 takes 5, and the Day 1 upgrade lists differ. Because each node has a shared daily attempt cap, spending cheap nodes first postpones the capped bottleneck materials and stretches completion dates that Goals, Today, Raids Plan and Insights all show.

## What Changes

- Change the per-goal spending order in the shared estimate: instead of ordering (material, node) pairs by node energy cost, order materials by V1's rule — the goal's still-unfinished materials with the longest time to finish first — and spend each material's nodes in its existing node order.
- A material's time to finish is its remaining count divided by the items per day its selected nodes can yield under the daily energy budget and each node's daily attempt cap (V1's `calculateDaysToCompleteMaterial`).
- Keep unchanged: goal-priority order across goals, per-battle daily attempt caps shared across goals and materials, inventory allocation by priority, farming stages, flat suppliers, node selection.
- **BREAKING (V2 plan output only):** completion dates, per-day raid lists and per-day energy splits change for goals that mix cheap and capped materials. V2 is pre-production, so no migration is needed.

Out of scope: V1's energy rounding (floored farmed items, 1,414 vs 1,408 energy), V1's node tie-break (`isSuggested`, energy per item, elite, node number vs V2's `expectedGold`), V1's own campaign-progress source, V1's "By total materials" order and home-screen-event ordering.

## Capabilities

### New Capabilities

_None._

### Modified Capabilities

- `goal-farming-estimates`: adds the within-goal spending-order requirement (longest-time-to-finish material first); existing cross-goal priority, attempt-cap sharing and inventory requirements are unchanged.

## Impact

- `apps/web/src/fsd/features/goal-farming/lib/estimate.ts` (`spendDay`) — ordering only; callers `estimateGoal` and `estimatePlan` (`estimate-plan.ts`) pass the daily energy budget through.
- Engine and consumer tests that assert completion days or per-day entries (`goal-farming` lib tests, `daily-raids` model tests, Raids Plan/Today page fixtures) may need updated expectations.
- No API, persistence or UI changes; no companion `tacticus-planner-api` change.
