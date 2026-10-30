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
