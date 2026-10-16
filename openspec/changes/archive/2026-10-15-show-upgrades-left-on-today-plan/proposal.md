## Why

UserJot "Daily raids" (point 2): Today's plan labels each node "N attempts used", the same words Today's Attempts uses for real raids, so planned raids read as already done. A raid count is also only a guess, since drops are random. Players need to know when to stop raiding a node, not how many times the plan guessed they would.

## What Changes

- Today's plan rows (Today and Bonus Raids) stop showing a raid count.
- A node planned below its daily attempt cap shows how many of the resource its goal still needs when it gets there: "N upgrades left", or "N shards left" for shards.
- A node planned up to its daily attempt cap shows nothing (it replaces "Max raids"): the player raids it out.
- The Home Daily Raids widget rows follow the same rule; a node shared by several goals sums their needs for the row's reward.
- The estimator records, per planned node, how much of the resource was still needed when that node's raids began (`RaidBreakdownEntry.remainingBefore`).
- Today's Attempts keeps its real "N attempts used" count. Plan › Schedule is unchanged.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `daily-raids-today`: "Today's raid schedule" is replaced by "Today's raid schedule shows what is left to farm"; planned node rows show "upgrades left" below the daily cap and nothing at the cap, instead of a raid count or "Max raids".
- `home-raids-widget`: rows use the same label; merged rows sum the goals' remaining need.

## Impact

- `features/goal-farming`: `RaidBreakdownEntry.remainingBefore`, set in `spendDay`.
- `features/daily-raids`: new `plannedRaidNeed` helper and `PlannedRaidNeedBadge`; `resource-card.tsx`, `location-row.tsx`, `flatten-today-locations.ts`.
- `dailies` locales (en/de/es/fr): add `schedule.upgradesLeft` / `schedule.shardsLeft`; remove the unused `schedule.maxRaids` and `schedule.node`.
- No API or persisted-data change.
