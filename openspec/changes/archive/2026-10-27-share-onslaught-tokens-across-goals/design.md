# Design

## Pool in runs, not shards

Onslaught tokens are spent one per run, but each unit yields a different number of shards per run
(`FlatSupplier.shardsPerRun`). The shared pool is therefore counted in runs. A supplier with
`shardsPerRun` set is an Onslaught source; its daily run budget is
`supplyOnDay(day) / shardsPerRun` (the cadence), and its available shards are
`(budget - runsUsedToday) * shardsPerRun`.

## Reuse the per-day pool map

`estimatePlan` already passes one per-day `Map` to `applyFlatSuppliers` for shop offers, keyed by
offer id. Onslaught runs use the same map under the reserved key `onslaught:runs` (shop offer ids
are `<shopId>:<rewardType>`, so they can't collide). The parameter is renamed `dailySupplyUsed`.
Regular and Mythic Onslaught suppliers draw on the same pool, since both spend the same tokens.
Within a goal, `applyFlatSuppliers` consults the Mythic Onslaught supplier last: a run yields
regular shards until the unit reaches Mythic.

## Mythic shard demand

Today, Insights and Schedule used to keep Mythic shards count-only, so a Mythic Onslaught supplier
had nothing to draw on and Mythic runs never consumed the pool. `computeGoalAcquisition` now emits
a Mythic Onslaught supplier and returns `mythicShardNeed` when an Ascension goal with Onslaught
needs Mythic shards; both callers add that need. Selected Mythic shop offers join it then. Campaign
Mythic nodes stay outside these consumers' farm-location set, so a goal without Onslaught keeps
Mythic shards count-only.

## Alternatives

- Filter the day card to the first Onslaught goal only. Rejected: the estimates would still
  count Onslaught for every goal, so dates and the schedule would disagree.
