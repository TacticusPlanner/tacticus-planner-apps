import { rankAt } from "@workspace/game-domain"

import type { GoalDetail } from "@/entities/goal"
import { allocatePlanInventory } from "@/entities/goal-farming"
import type { EstimateResourceId, GoalNeed } from "@/entities/goal-farming"

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
 * The cumulative target each farming stage (milestone) of a goal sets for a resource, in stage
 * order: for Atlacoya to D3 with a G1 milestone, Auramite Wing's targets are [28, 64]. Only goals
 * with more than one stage that needs the resource get an entry. A per-goal card counts toward the
 * first of these the player has not reached yet, the milestone the schedule is farming, rather than
 * the goal's final target (`projectResourceProgress`).
 */
export function resourceMilestoneTargets(
  goals: GoalNeed[]
): Map<string, number[]> {
  const milestones = new Map<string, number[]>()
  for (const goal of goals) {
    if (!goal.stages || goal.stages.length < 2) continue
    const cumulative = new Map<EstimateResourceId, number[]>()
    const totals = new Map<EstimateResourceId, number>()
    for (const stage of goal.stages) {
      for (const [resourceId, count] of countById(stage.needs)) {
        const total = (totals.get(resourceId) ?? 0) + count
        totals.set(resourceId, total)
        cumulative.set(resourceId, [
          ...(cumulative.get(resourceId) ?? []),
          total,
        ])
      }
    }
    for (const [resourceId, targets] of cumulative) {
      if (targets.length < 2) continue
      milestones.set(dailyRaidResourceKey(goal.goalId, resourceId), targets)
    }
  }
  return milestones
}

function countById(
  needs: readonly { id: EstimateResourceId; count: number }[]
) {
  const counts = new Map<EstimateResourceId, number>()
  for (const need of needs) {
    counts.set(need.id, (counts.get(need.id) ?? 0) + need.count)
  }
  return counts
}

/** The first milestone target above what is owned, else the final target. */
function milestoneTarget(
  owned: number,
  finalTarget: number,
  milestones: readonly number[] | undefined
) {
  return milestones?.find((target) => target > owned) ?? finalTarget
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
  initial: ReadonlyMap<string, DailyRaidResourceProgress>,
  milestones: ReadonlyMap<string, readonly number[]> = new Map()
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
        [...initial].map(([key, progress]) => {
          const owned = Math.floor(
            progress.owned + (gained.get(key) ?? 0) + 1e-9
          )
          const target = milestoneTarget(
            owned,
            progress.target,
            milestones.get(key)
          )
          return [key, { owned: Math.min(target, owned), target }]
        })
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
