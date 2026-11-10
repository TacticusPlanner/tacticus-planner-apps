import type { DailyRaidsViewModel } from "@/features/daily-raids"

import { questDropNeed } from "./quest-drop-need"

/** A quest drop the player's goals still need, with every battle that drops it. */
export type QuestGoalDrop<TId extends string = string> = {
  upgradeId: TId
  have: number
  need: number
  /** Up to 3 units of the goals needing it, in goal priority. */
  units: string[]
  battles: { number: number; numerator: number; denominator: number }[]
}

export type QuestGoalDrops<TId extends string = string> =
  { status: "hidden" } | { status: "ready"; drops: QuestGoalDrop<TId>[] }

type DropBattle<TId extends string> = {
  number: number
  loot: {
    upgradeId: TId
    chanceNumerator: number
    chanceDenominator: number
  }
}

/**
 * The quest's drops the active goals still need, each with its have / need and the battles that drop
 * it (best odds first), so the player sees where to farm without opening every battle. Ordered by
 * the first battle that drops each. Hidden while the goal plan loads, fails or there are no goals.
 */
export function questGoalDrops<TId extends string>(
  raids: DailyRaidsViewModel,
  battles: readonly DropBattle<TId>[]
): QuestGoalDrops<TId> {
  if (raids.status !== "ready") return { status: "hidden" }
  const byUpgrade = new Map<TId, QuestGoalDrop<TId>>()
  for (const battle of [...battles].sort((a, b) => a.number - b.number)) {
    const { upgradeId, chanceNumerator, chanceDenominator } = battle.loot
    let drop = byUpgrade.get(upgradeId)
    if (!drop) {
      const need = questDropNeed(raids, upgradeId)
      if (need.status !== "need") continue
      drop = {
        upgradeId,
        have: need.have,
        need: need.need,
        units: need.units,
        battles: [],
      }
      byUpgrade.set(upgradeId, drop)
    }
    drop.battles.push({
      number: battle.number,
      numerator: chanceNumerator,
      denominator: chanceDenominator,
    })
  }
  const odds = (battle: QuestGoalDrop["battles"][number]) =>
    battle.numerator / battle.denominator
  return {
    status: "ready",
    drops: [...byUpgrade.values()].map((drop) => ({
      ...drop,
      battles: [...drop.battles].sort(
        (a, b) => odds(b) - odds(a) || a.number - b.number
      ),
    })),
  }
}
