import type { GoalStatus } from "@/entities/goal"
import type { ProjectUnitKey } from "@/entities/project"
import type { EstimateOutcome } from "@/features/goal-farming"
import type { GoalOverviewMetrics } from "../attainment/use-goals-overview-metrics"
import type { GoalRow } from "../shared/types"

export type ProjectUnitPlan = ProjectUnitKey & {
  position: number
  goals: GoalRow[]
  historicalGoals: GoalRow[]
  statusCounts: Record<GoalStatus, number>
  blockedCount: number
  estimate: EstimateOutcome | undefined
}

function projectUnitKey(unit: ProjectUnitPlan) {
  return `${unit.entityType}:${unit.entityId}`
}

export function reorderProjectUnits(
  units: ProjectUnitPlan[],
  activeId: string | number,
  overId: string | number
) {
  const from = units.findIndex((unit) => projectUnitKey(unit) === activeId)
  const to = units.findIndex((unit) => projectUnitKey(unit) === overId)
  if (from < 0 || to < 0 || from === to) return units

  const reordered = [...units]
  const [unit] = reordered.splice(from, 1)
  if (unit) reordered.splice(to, 0, unit)
  return reordered
}

export function projectUnitPlans(
  rows: GoalRow[],
  metrics: ReadonlyMap<string, GoalOverviewMetrics> = new Map(),
  estimates: ReadonlyMap<string, EstimateOutcome> = new Map()
): ProjectUnitPlan[] {
  const grouped = new Map<string, GoalRow[]>()
  for (const goal of rows) {
    if (goal.entityType !== "Character" && goal.entityType !== "Mow") continue
    const key = `${goal.entityType}:${goal.entityId}`
    grouped.set(key, [...(grouped.get(key) ?? []), goal])
  }

  return [...grouped.values()]
    .map((unitRows) => {
      const inFlight = unitRows.filter(
        (goal) => goal.status === "Active" || goal.status === "Paused"
      )
      if (inFlight.length === 0) return undefined
      const goals = dependencyFirst(inFlight)
      const first = goals[0]!
      return {
        entityType: first.entityType as ProjectUnitKey["entityType"],
        entityId: first.entityId,
        position: Math.min(...goals.map((goal) => goal.priority ?? 0)),
        goals,
        historicalGoals: unitRows.filter(
          (goal) => goal.status === "Completed" || goal.status === "Archived"
        ),
        statusCounts: countStatuses(unitRows),
        blockedCount: goals.filter(
          (goal) => metrics.get(goal.goalId)?.blockers.isBlocked
        ).length,
        estimate: goals
          .map((goal) => estimates.get(goal.goalId))
          .find((estimate) => estimate !== undefined),
      }
    })
    .filter((unit): unit is ProjectUnitPlan => unit !== undefined)
    .sort((left, right) => left.position - right.position)
}

function dependencyFirst(rows: GoalRow[]): GoalRow[] {
  const remaining = rows
    .map((goal, index) => ({ goal, index }))
    .sort(
      (left, right) =>
        (left.goal.priority ?? left.index) -
          (right.goal.priority ?? right.index) ||
        left.goal.goalId.localeCompare(right.goal.goalId)
    )
  const ids = new Set(remaining.map(({ goal }) => goal.goalId))
  const emitted = new Set<string>()
  const ordered: GoalRow[] = []

  while (remaining.length > 0) {
    const index = remaining.findIndex(({ goal }) =>
      (goal.dependsOn ?? [])
        .filter((id) => ids.has(id))
        .every((id) => emitted.has(id))
    )
    const [{ goal }] = remaining.splice(index < 0 ? 0 : index, 1)
    ordered.push(goal)
    emitted.add(goal.goalId)
  }
  return ordered
}

function countStatuses(rows: GoalRow[]): Record<GoalStatus, number> {
  const result: Record<GoalStatus, number> = {
    Active: 0,
    Paused: 0,
    Completed: 0,
    Archived: 0,
  }
  for (const row of rows) result[row.status]++
  return result
}
