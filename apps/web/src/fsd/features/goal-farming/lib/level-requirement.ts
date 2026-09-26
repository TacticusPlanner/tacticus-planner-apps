import { rankAt } from "@workspace/game-domain"

import type { GoalDetail } from "@/entities/goal"

import {
  additionalTargetFromWire,
  requiredLevelForRankTarget,
} from "./rank-additional-target"

/** The character level a goal's own target needs — a derived property of the target, never a goal of
 * its own (integrate-level-progression-into-rank-goals). A Character Rank goal needs the level of its
 * end rank plus any partial upgrade slots; a Character Ability goal needs the level equal to the
 * higher of its two ability targets (ability levels and character levels share one scale). `null`
 * for every other goal kind and for a Mow, whose own `xpLevel` is never targeted. */
export function requiredLevelForGoal(
  goal: Pick<GoalDetail, "goalType" | "entityType" | "config">
): number | null {
  if (goal.entityType !== "Character") return null
  if (goal.goalType === "Rank" && goal.config.rank) {
    const targetRank = rankAt(goal.config.rank.end)
    return requiredLevelForRankTarget(
      targetRank,
      additionalTargetFromWire(targetRank, goal.config.rank)
    )
  }
  if (goal.goalType === "Ability" && goal.config.ability) {
    const level = Math.max(
      goal.config.ability.activeEnd,
      goal.config.ability.passiveEnd
    )
    return level > 0 ? level : null
  }
  return null
}
