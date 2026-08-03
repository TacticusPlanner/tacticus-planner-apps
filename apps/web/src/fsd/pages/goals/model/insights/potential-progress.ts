import type { GoalDetail } from "@/entities/goal"

import type { GoalProgress } from "../attainment/goal-progress"
import type { GoalInventoryAllocation } from "../estimate/estimate.domain"

function clampRatio(value: number): number {
  return Math.min(1, Math.max(0, value))
}

function actualRatio(progress: GoalProgress): number | null {
  return progress.kind === "Unknown" || progress.ratio === null
    ? null
    : progress.ratio
}

function stageBoundary(detail: GoalDetail, target: string): number {
  if (target === "final") return 1

  if (detail.goalType === "Rank" && detail.config.rank) {
    const { start, end } = detail.config.rank
    const targetIndex = Number(target)
    if (!Number.isFinite(targetIndex) || end <= start) return 1
    return clampRatio((targetIndex - start) / (end - start))
  }

  if (detail.goalType === "Ability" && detail.config.ability) {
    const ability = detail.config.ability
    const usesActive = ability.activeEnd > ability.activeStart
    const start = usesActive ? ability.activeStart : ability.passiveStart
    const end = usesActive ? ability.activeEnd : ability.passiveEnd
    const targetLevel = Number(target)
    if (!Number.isFinite(targetLevel) || end <= start) return 1
    return clampRatio((targetLevel - start) / (end - start))
  }

  return 1
}

export function computePotentialProgressRatio(
  detail: GoalDetail,
  progress: GoalProgress,
  allocation: GoalInventoryAllocation<string> | undefined
): number | null {
  const current = actualRatio(progress)
  if (current === null || !allocation) return null

  let potential = current
  let previousBoundary = current

  for (const stage of allocation.stages) {
    const boundary = Math.max(
      previousBoundary,
      stageBoundary(detail, stage.target)
    )
    const required = stage.needs.reduce((sum, need) => sum + need.count, 0)
    const remaining = stage.remaining.reduce((sum, need) => sum + need.count, 0)
    const allocatedFraction =
      required <= 0 ? 1 : clampRatio((required - remaining) / required)

    potential = Math.max(
      potential,
      previousBoundary + (boundary - previousBoundary) * allocatedFraction
    )
    if (remaining > 0) break
    previousBoundary = boundary
  }

  return clampRatio(Math.max(current, potential))
}
