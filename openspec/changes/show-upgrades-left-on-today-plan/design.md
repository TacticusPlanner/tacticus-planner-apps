## Context

`spendDay` (`features/goal-farming/lib/estimate.ts`) raids each node `min(affordable, needed, attemptsRemaining)` times, and Today's rows (`resource-card.tsx`, Home's `location-row.tsx`) showed that number with the "attempts used" string, or "Max raids" at the cap.

## Decisions

- **What "upgrades left" counts.** The goal's remaining need for that resource at the moment the plan reaches the node (`remainingBefore`), rounded up. For the first node of a resource that is the real need from inventory; for a later node the same day it is the need less the expected drops of the earlier nodes. This is what tells the player when to stop at that node. The alternative, the goal's total need, would overstate what a second node has to cover.
- **When it shows.** Any planned count below the node's daily cap, whether the plan stopped because the need ran out or because the day's energy did. At or above the cap (per entry, as before; Home compares the merged count) nothing shows. Nodes with no cap (`dailyAttempts` 0) always show the need.
- **Shards.** `shard:` and `mythic-shard:` resources say "shards left"; everything else says "upgrades left".
- **Home merged rows.** `flattenTodayLocations` already keeps the first entry's `resourceId`; it now sums `remainingBefore` over merged entries with that same resource.
- **Engine field, not a UI recomputation.** `remainingBefore` is set where the decision is made, so every consumer of the breakdown sees the same number without re-simulating the day.

## Risks / Trade-offs

- A later node's count includes expected drops of earlier nodes, so it is still an estimate when an earlier node drops more or less than expected. Acceptable: the first node, where most raiding happens, is exact.
