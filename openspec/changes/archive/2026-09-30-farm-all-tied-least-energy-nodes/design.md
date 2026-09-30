## Context

`selectFarmNodes` (`goal-farming/lib/estimate.ts`) builds one `FarmNode` per eligible battle (summing drop rates when a battle drops the same material more than once), then, unless the goal restricts its farm locations, keeps nodes whose `energyCost / dropRate` exactly equals the minimum and, if more than one remains, narrows to the single highest `expectedGold` (or returns all when none report gold). `spendDay` spends a material's nodes in the order it receives them, and each battle's daily attempt cap is shared across every goal and material for the day.

V1 (`populateLocationsData`, "Least energy") keeps every unlocked, event-eligible location with `energyPerItem <= min`, where `energyPerItem = Number.parseFloat((1 / (dropRate / energyCost)).toFixed(2))` (`campaigns.service.ts:134`), and marks all of them suggested; there is no gold narrowing in this path.

Live comparison, same account, 538 energy per day: V1 raids Psyk-Conductive Material at two nodes (Fall of Cadia ME 38 and ME 7) and Psychic Force Conduit at two (Saim-Hann ME 39 and ME 15); V2 uses ME 38 and ME 39 only. Each V2 node is capped at 6 raids of 10 energy, so V2 farms about half the items V1 does for those materials.

## Goals / Non-Goals

**Goals:**

- Use every node tied on best energy efficiency, with gold deciding raid order, so V2's yield and time to finish match V1's on tied nodes.

**Non-Goals:**

- The restricted-locations path, blocked-goal handling (PLAN-014), other farm strategies, farmed-item rounding, and unlocked-node sourcing.

## Decisions

### 1. Tie test uses V1's two-decimal rounding

Efficiency is computed as `energyCost / dropRate` and rounded to two decimals (`Number(x.toFixed(2))`, the same operation V1 applies) for the tie test only. The node keeps its real `dropRate`, so yield math and `daysToFinish` are unaffected by the rounding.

Alternative: exact equality as today. Rejected — V1 counts values like 33.331 and 33.334 as tied, and a raw-float comparison can also miss ties that only differ by floating-point error.

### 2. Return all tied nodes, ordered by gold

After keeping the nodes at the minimum rounded efficiency, sort them by `expectedGold` descending with `null`/absent last, using a stable sort so equal nodes keep their existing (catalog) order. Never drop a tied node. No change is needed in `spendDay`: it already iterates a material's nodes in received order, so the highest-gold node's attempts are used first.

Alternative: interleave tied nodes evenly. Rejected — the user wants gold to decide, and raiding one node's cap first is simply what filling attempts in order does.

### 3. Downstream callers

`plan-bottlenecks.ts` uses `nodes[0]` as the cheapest node: with gold-first ordering it is still a minimum-efficiency node (equal to the rounded minimum), so its energy figure shifts by at most the rounding tolerance. `use-progression-preview.ts` sums daily shards across nodes, so its display figure rises for materials with several tied nodes, which is the intended more accurate capacity.

### 4. Restricted path unchanged

When `farmingLocationIds` is non-empty the function returns its candidates as today.

## Risks / Trade-offs

- [Behavior change ripples into tests and screens] → Replace the single-node tie-break tests; update fixture expectations only where explained by extra tied nodes; compare live against V1 afterward.
- [Rounded ties can pair nodes with slightly different real efficiency] → Intentional (V1 parity); yield still uses each node's real drop rate.
- [More nodes make a day's raid list longer] → Bounded by energy and per-battle caps already applied.

## Migration Plan

Engine-only, V2 pre-production: ship directly; rollback is a revert.
