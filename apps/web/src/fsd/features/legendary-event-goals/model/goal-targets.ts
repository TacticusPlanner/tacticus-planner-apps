import { isProgression, rankAt } from "@workspace/game-domain"

import {
  rankTargetSlots,
  type GoalDetail,
  type GoalKind,
} from "@/entities/goal"
import type {
  LegendaryEventGoalRef,
  LegendaryEventGoalTarget,
} from "@/entities/legendary-event"

const PREVIEW_KINDS: ReadonlySet<GoalKind> = new Set([
  "Unlock",
  "Ascension",
  "Rank",
  "Ability",
])

/** The Active goals Goals Preview reads (design D3): Character goals of kinds Unlock, Ascension,
 *  Rank and Ability whose unit the event allows. Paused goals never reach this list. */
export function eventGoalSummaries(
  active: readonly GoalDetail[],
  allowedUnitIds: ReadonlySet<string>
): GoalDetail[] {
  return active.filter(
    (goal) =>
      goal.status === "Active" &&
      goal.entityType === "Character" &&
      PREVIEW_KINDS.has(goal.goalType) &&
      allowedUnitIds.has(goal.entityId)
  )
}

function goalRef(detail: GoalDetail): LegendaryEventGoalRef | undefined {
  const { config, goalId } = detail
  switch (detail.goalType) {
    case "Unlock":
      return { goalId, kind: "Unlock" }
    case "Ascension": {
      const end = config.progression?.end
      return end && isProgression(end)
        ? { goalId, kind: "Ascension", progressionEnd: end }
        : undefined
    }
    case "Rank":
      return config.rank
        ? {
            goalId,
            kind: "Rank",
            rankEnd: rankAt(config.rank.end),
            appliedUpgradesEnd: rankTargetSlots(config.rank),
          }
        : undefined
    case "Ability":
      return config.ability
        ? {
            goalId,
            kind: "Ability",
            activeEnd: config.ability.activeEnd,
            passiveEnd: config.ability.passiveEnd,
          }
        : undefined
    default:
      return undefined
  }
}

/** Goal details grouped per unit, in the order the details arrive (global goal order). */
export function goalTargetsFromDetails(
  details: readonly GoalDetail[]
): LegendaryEventGoalTarget[] {
  const byUnit = new Map<string, LegendaryEventGoalRef[]>()
  for (const detail of details) {
    const ref = goalRef(detail)
    if (!ref) continue
    const goals = byUnit.get(detail.entityId) ?? []
    goals.push(ref)
    byUnit.set(detail.entityId, goals)
  }
  return [...byUnit].map(([unitId, goals]) => ({ unitId, goals }))
}
