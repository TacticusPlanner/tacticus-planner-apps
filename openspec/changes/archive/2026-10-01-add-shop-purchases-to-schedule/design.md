## Context

`estimatePlan` (`features/goal-farming/lib/estimate-plan.ts`) already applies each goal's flat suppliers per day (`applyFlatSuppliers` -> `bySupplier`, keyed by `FlatSupplier.key`, which for shop offers is the `offerId`) and accumulates per-source totals, but the schedule it returns (`RaidDaySchedule`) only carries raid entries. Day cells (`buildPlanDayCells`), the unit filter bar (`buildPlanUnitRanges`) and day-card unit icons are all derived from those entries, so shop-only units never appear. Remaining chips derive from the goal's resource need and the per-source attribution.

## Decisions

- **Emit, don't re-derive.** Add `shopEntries` to `RaidDaySchedule` (`{ goalId, offerId, expectedShards }` per day) from the per-day `bySupplier` already computed in the estimate loop. Purchases, currency and the shop's id are derived at the view-model layer from the offer (`rewardQty`, `cost`). Keeps the engine currency-agnostic and the estimate untouched.
- **Onslaught mirrors shops.** The same loop emits `onslaughtEntries` (`{ goalId, expectedShards, runs }`) for `onslaught:*` supplier keys, with runs = shards / `shardsPerRun` from the supplier (unrounded). `PlanDayCells` gains `onslaught` (per unit, merged across the unit's goals and across regular/mythic keys) and `units` unions in those units. Raid entries, token totals and estimates are unchanged.
- **Cells stay raid-only.** Shop entries do not enter `PlanCell`. `PlanDayCells` gains `shops` (grouped by shop id, then unit) and `units` becomes the union of actionable-cell units and shop-entry units; `buildPlanUnitRanges` then covers shop days with no further change.
- **Filter dimming** extends from cells to shop rows using the same `selectedUnitId` match.
- **Section order:** actionable cells, "Raided", "Shops", then "Onslaught", inside the existing fixed-height scrolling grid.
- **Remaining chip:** currency still to spend = sum over the goal's attributed shop shards per offer / `rewardQty` * `cost.amount`, grouped by `cost.currency`. Reuses the existing per-source attribution, so it is net of owned shards and campaign supply by construction, and matches the day cards' totals for the goal.
- **Currency icon/name:** resolved client-side from the currency id (`guildWarCurrency`, `elderShopCurrency`, `crusadeCurrency`), consistent with id-only catalog data.

## Risks

- Expected-value purchases are fractional; display rounds up for purchases and to whole currency for the chip, so sums over days may differ by rounding from the chip. Compute the chip from unrounded totals and round once.
- Schedule days beyond `PLAN_DAY_LIMIT` are paged; shop entries must follow the same paging.
- During manual testing, opening the Goals list status-filter popover (and once a row-actions menu) froze the browser tab. Unrelated to this change, but worth a separate investigation before relying on browser verification here.
