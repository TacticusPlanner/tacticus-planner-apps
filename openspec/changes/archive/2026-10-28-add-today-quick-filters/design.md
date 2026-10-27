# Design

## Context

Today's schedule comes from `runPlanSchedule` (`features/goal-farming/lib/estimate-plan.ts`): goals are taken in priority order, each goal's needs are classified into farm nodes by `classifyNeed` → `pickFarmNodes`, and each day's energy is spent goal by goal through `spendDay` (longest-to-finish material first). Raids Filters reach the engine as `EstimatePlanParams.nodeFilter`, which today drops nodes after the cheapest set is picked. V1 offered the same choices as global settings in `upgrades.service.ts` (`farmStrategy`, `farmPreferences.order`).

## Goals / Non-Goals

**Goals:**

- Cover the UserJot use cases with temporary, visible switches on Today.
- Let a filter route a material to the next-cheapest passing node.

**Non-Goals:**

- Porting V1's settings dialog, its All locations option, the manual HSE pick or the manual campaign-event pick.
- Changing Plan > Schedule, Goals dates, Insights, the HSE/HRE tabs or the Home raids widget.
- A smart priority mode that weaves bottlenecks into priority order (a possible follow-up).

## Decisions

1. **Filter, then pick.** `pickFarmNodes` filters the candidate nodes first, then keeps the least energy-per-item set among the survivors. `classifyNeed` reports `FilteredOut` when candidates exist but none pass. This matches the HSE farm list, which already filters first. The cost is that a filter can now move a material to a pricier node, which is the point of the change.
2. **Fewer raids is a tie-break inside the pick.** After the least-energy set is found, `fewerRaids` keeps only the nodes with the highest `energyCost`. Equal energy per item at a higher cost per battle means more items per raid, so fewer raids for the same items. Pinned locations are used as chosen, as today.
3. **Bottlenecks pools needs in the day loop.** With `combineGoals`, `runPlanSchedule` still allocates inventory in priority order and applies flat suppliers (shops, Onslaught) per goal. It then sums every pending goal's remaining need across all stages into one pool and calls `spendDay` once per day on it. Each resource's nodes come from the highest-priority goal that needs it (so a pin on that goal applies). The farmed amount is taken off the goals' stages in priority order, and each breakdown entry is credited to the highest-priority goal still needing that resource, so Today keeps its per-goal grouping.
4. **Quick filters are URL state on Today.** `?quick=fewerRaids,bottlenecks` (comma list, unknown values dropped), read and written through React Router's search params like Collection's `?quick=`. Only Today reads it; `useDailyRaids` takes the quick filters as an option, so the Home widget and other callers stay on the defaults.
5. **Explanations are visible.** Each chip carries a `title` tooltip, and each chip that is on adds one line under the row stating what it changes and that Plan and Goals dates still follow priority.

## Risks / Trade-offs

- With Bottlenecks on, a lower-priority goal can take today's energy ahead of a higher one. That is the intent, and the note says so.
- Crediting a pooled raid to one goal hides that it also serves later goals. Splitting raids across goals was rejected as noisy for a one-day list.
- Filter-then-pick removes the "filtered out" signal when a pricier node exists. The player sees the pricier node instead, which is what V1's Custom did.

## Migration Plan

None. Client-only, no stored data; Raids Filters keep their stored shape.
