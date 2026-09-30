## Why

When several farm nodes drop a needed material at the same energy efficiency, V2 keeps only the single node with the highest `expectedGold`. V1's "Least energy" strategy keeps every node whose energy per item (rounded to two decimals) ties the best, and raids all of them. In a live comparison on the same account (538 energy per day, "By goals priority"), V1 farms Psyk-Conductive Material at two nodes (Fall of Cadia ME 38 and ME 7) and Psychic Force Conduit at two (Saim-Hann ME 39 and ME 15) on Day 1, while V2 uses one node each. Each node has its own daily attempt cap, so V2's yield is roughly halved for those materials: Psyk-Conductive gains 2.6 items on Day 1 in V2 against 5 in V1. That inflates V2's time to finish, changes which upgrades appear on each day, and pushes goals out by days. Gold still matters, but it should decide which tied node is raided first, not remove the others.

## What Changes

- Compare node efficiency (`energyCost / dropRate`) rounded to two decimals, as V1's `energyPerItem` does, so near-ties count as ties.
- Return every node that ties the best efficiency instead of narrowing to one.
- Use `expectedGold` as an ordering preference among tied nodes: higher `expectedGold` first, nodes with no `expectedGold` last, remaining ties keep their existing order. The engine already spends a material's nodes in the order it receives them, so higher-gold nodes fill their daily attempt caps first and their gold is collected first.
- Keep unchanged: farming-location overrides (user-chosen locations), unlocked-node and eligibility filtering, per-battle daily attempt caps shared across goals, goal-priority order.
- **BREAKING (V2 plan output only):** yields, per-day raid lists, completion dates and energy splits change for materials that have tied nodes. V2 is pre-production, so no migration is needed.

Out of scope: blocked-goal handling (PLAN-014, tracked separately), V1's energy rounding of farmed items, the "Least energy, fewest raid tickets" and "Custom" strategies, and any UI change.

## Capabilities

### New Capabilities

_None._

### Modified Capabilities

- `daily-raids-today`: the "Farm node selection prefers energy efficiency, then value" requirement changes from "select the single tied location with the higher expected gold" to "use every location tied on energy efficiency (two-decimal rounding), higher expected gold first". The shared estimate (Today, Raids Plan, Goals, Insights) all use this selection.

## Impact

- `apps/web/src/fsd/features/goal-farming/lib/estimate.ts` — `selectFarmNodes` (tie comparison and ordering); `spendDay` needs no change.
- `estimate.test.ts` — the "expectedGold tie-break" tests assert single-node selection and must be replaced.
- Other `selectFarmNodes` callers: `pages/goals/model/insights/plan-bottlenecks.ts` (reads `nodes[0]`, the highest-gold tied node, still valid) and `pages/goals/model/goal-creation-form/use-progression-preview.ts` (sums daily yield across nodes, so its display figure rises with the extra nodes).
- Tests asserting completion days or per-day entries in the estimate and daily-raids model may need new expectations.
- No API, persistence or UI changes; no companion `tacticus-planner-api` change.
