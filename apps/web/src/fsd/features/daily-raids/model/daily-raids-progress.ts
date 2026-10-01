import { rankAt } from "@workspace/game-domain"

import type { GoalDetail } from "@/entities/goal"
import {
  allocatePlanInventory,
  type EstimateResourceId,
  type GoalNeed,
} from "@/features/goal-farming/@x/daily-raids"

import { dailyRaidResourceKey } from "./daily-raids.domain"
import type {
  DailyRaidResourceProgress,
  DailyRaidsCalculationViewModel,
} from "./daily-raids.domain"

export function resourceProgress(
  goals: GoalNeed[],
  inventory: { id: EstimateResourceId; count: number }[],
  shardProgress: ReadonlyMap<string, DailyRaidResourceProgress>
) {
  const progress = new Map(shardProgress)
  const allocations = allocatePlanInventory(goals, inventory)

  for (const goal of goals) {
    const totals = new Map<EstimateResourceId, DailyRaidResourceProgress>()
    for (const stage of allocations.get(goal.goalId)?.stages ?? []) {
      const remaining = new Map(
        stage.remaining.map((entry) => [entry.id, entry.count])
      )
      for (const need of stage.needs) {
        const current = totals.get(need.id) ?? { owned: 0, target: 0 }
        current.target += need.count
        current.owned += need.count - (remaining.get(need.id) ?? 0)
        totals.set(need.id, current)
      }
    }
    for (const [resourceId, value] of totals) {
      const key = dailyRaidResourceKey(goal.goalId, resourceId)
      if (!progress.has(key)) progress.set(key, value)
    }
  }

  return progress
}

/**
 * One have/need figure per resource over every goal in the run (the HSE farm list's "X/Y"): Y is the
 * total target and X what the player holds. An upgrade material's target is the sum of its goals'
 * targets and X the inventory count (held once, however many goals want it, and uncapped). A shard
 * resource is a unit's absolute shard count, so goals on one unit do not add: the highest target wins
 * and X is the shard count it was measured against. Built from `resourceProgress`, not recomputed.
 */
export function totalResourceProgress(
  progress: ReadonlyMap<string, DailyRaidResourceProgress>,
  inventory: readonly { id: EstimateResourceId; count: number }[],
  shardResourceIds: ReadonlySet<string>
): Map<string, DailyRaidResourceProgress> {
  const held = new Map(
    inventory.map((entry) => [entry.id as string, entry.count])
  )
  const totals = new Map<string, DailyRaidResourceProgress>()
  for (const [key, value] of progress) {
    if (value.target <= 0) continue
    // Goal ids are uuids, so the resource id is everything after the first colon.
    const resourceId = key.slice(key.indexOf(":") + 1)
    const current = totals.get(resourceId)
    if (shardResourceIds.has(resourceId)) {
      if (!current || value.target > current.target) {
        totals.set(resourceId, { ...value })
      }
    } else {
      totals.set(resourceId, {
        owned: held.get(resourceId) ?? 0,
        target: (current?.target ?? 0) + value.target,
      })
    }
  }
  return totals
}

export function projectResourceProgress(
  days: DailyRaidsCalculationViewModel["today"][],
  initial: ReadonlyMap<string, DailyRaidResourceProgress>
) {
  const gained = new Map<string, number>()
  const result = new Map<
    number,
    ReadonlyMap<string, DailyRaidResourceProgress>
  >()

  for (const day of days) {
    result.set(
      day.day,
      new Map(
        [...initial].map(([key, progress]) => [
          key,
          {
            owned: Math.min(
              progress.target,
              Math.floor(progress.owned + (gained.get(key) ?? 0) + 1e-9)
            ),
            target: progress.target,
          },
        ])
      )
    )
    for (const entry of day.entries) {
      const key = dailyRaidResourceKey(entry.goalId, entry.resourceId)
      gained.set(key, (gained.get(key) ?? 0) + entry.itemsFarmed)
    }
  }

  return result
}

export function goalTargetLabel(detail: GoalDetail): string {
  if (detail.goalType === "Rank" && detail.config.rank) {
    return `Rank ${rankAt(detail.config.rank.end)}`
  }
  if (detail.goalType === "Ability" && detail.config.ability) {
    const target = detail.config.ability
    return `Ability ${Math.max(target.activeEnd, target.passiveEnd)}`
  }
  if (detail.goalType === "Ascension" && detail.config.progression) {
    return `Ascension ${detail.config.progression.end}`
  }
  if (detail.goalType === "Unlock") return "Unlock"
  if (detail.goalType === "Upgrade" && detail.config.upgrade) {
    return `Upgrade ${detail.config.upgrade.targets.reduce((sum, item) => sum + item.quantity, 0)}`
  }
  return detail.goalType
}
