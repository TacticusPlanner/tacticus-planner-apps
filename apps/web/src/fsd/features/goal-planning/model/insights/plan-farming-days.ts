import type { BattleId } from "@workspace/game-domain"

/** Raids per node, with the node's daily attempt cap. */
export type RunsByBattle = Map<
  BattleId,
  { runs: number; dailyAttempts: number }
>

/** Days to make `runsByBattle` raids: never fewer than the energy allows (`energy` at `dailyEnergy`)
 *  nor than each node's daily attempt cap allows (its runs over `dailyAttempts`). A node with no
 *  cap set counts by energy alone. */
export function farmingDays(
  energy: number,
  runsByBattle: RunsByBattle,
  dailyEnergy: number
) {
  let days = energy / Math.max(1, dailyEnergy)
  for (const { runs, dailyAttempts } of runsByBattle.values()) {
    if (dailyAttempts > 0) days = Math.max(days, runs / dailyAttempts)
  }
  return days
}

/** Adds `runs` raids at `battleId` to a per-node tally for `farmingDays`. */
export function addRuns(
  runsByBattle: RunsByBattle,
  battleId: BattleId,
  runs: number,
  dailyAttempts: number
) {
  const entry = runsByBattle.get(battleId) ?? { runs: 0, dailyAttempts }
  entry.runs += runs
  runsByBattle.set(battleId, entry)
}

/** A node a resource can be farmed at, as `spreadRuns` needs it. */
export interface SpreadNode {
  battleId: BattleId
  energyCost: number
  dropRate: number
  dailyAttempts: number
}

/** Raids to farm `count` items from `nodes` the way the plan's estimate farms a day: every node at
 *  once, each up to its daily attempt cap. The raids are split in proportion to each node's items
 *  per day (`dropRate × dailyAttempts`) so all nodes finish together; a single capped node would
 *  otherwise report several times the days the estimate takes when the item drops at more than one
 *  equally good node. An uncapped node needs no help: all raids go to the cheapest such node. */
export function spreadRuns(
  count: number,
  nodes: readonly SpreadNode[]
): { node: SpreadNode; runs: number }[] {
  const usable = nodes.filter((node) => node.dropRate > 0)
  const energyPerItem = (node: SpreadNode) => node.energyCost / node.dropRate
  const uncapped = usable
    .filter((node) => node.dailyAttempts <= 0)
    .toSorted((a, b) => energyPerItem(a) - energyPerItem(b))[0]
  if (uncapped) {
    return [{ node: uncapped, runs: Math.ceil(count / uncapped.dropRate) }]
  }
  const itemsPerDay = usable.reduce(
    (sum, node) => sum + node.dropRate * node.dailyAttempts,
    0
  )
  if (itemsPerDay <= 0) return []
  return usable.map((node) => ({
    node,
    runs: Math.ceil((count * node.dailyAttempts) / itemsPerDay),
  }))
}
