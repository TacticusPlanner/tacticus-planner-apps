import type { ProjectUnitKey } from "@/entities/project"
import type { GoalRow } from "../shared/types"

export type ProjectUnitPlan = ProjectUnitKey & { goals: GoalRow[] }

export function projectUnitPlans(rows: GoalRow[]): ProjectUnitPlan[] {
  const units = new Map<string, ProjectUnitPlan>()
  for (const goal of rows) {
    if (
      (goal.entityType !== "Character" && goal.entityType !== "Mow") ||
      (goal.status !== "Active" && goal.status !== "Paused")
    )
      continue
    const key = `${goal.entityType}:${goal.entityId}`
    const unit = units.get(key)
    if (unit) unit.goals.push(goal)
    else
      units.set(key, {
        entityType: goal.entityType,
        entityId: goal.entityId,
        goals: [goal],
      })
  }
  return [...units.values()]
}
