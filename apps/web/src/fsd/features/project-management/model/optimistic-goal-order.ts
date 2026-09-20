import type { ProjectGoalSummary } from "@/entities/project"

/**
 * Client-side mirror of the API's two-zone `NormalizeAsync` renumbering: the submitted in-flight
 * goal ids get sequential priorities in their new order, then every other (historical) goal keeps
 * its prior relative order, renumbered to follow — so an optimistic cache write looks like what the
 * server will actually persist, not just a reordered array with stale priorities (priority, not
 * array position, is what `use-plan-insights`/`plan-insights-calc` order potential-progress
 * allocation and completion-date estimates by).
 */
export function applyOptimisticGoalOrder(
  goals: ProjectGoalSummary[],
  inFlightOrderedIds: string[]
): ProjectGoalSummary[] {
  const byId = new Map(goals.map((entry) => [entry.goal.goalId, entry]))
  const inFlightIds = new Set(inFlightOrderedIds)
  const inFlight = inFlightOrderedIds
    .map((id) => byId.get(id))
    .filter((entry): entry is ProjectGoalSummary => entry !== undefined)
  const historical = goals.filter(
    (entry) => !inFlightIds.has(entry.goal.goalId)
  )

  let nextPriority = 1
  return [...inFlight, ...historical].map((entry) => ({
    ...entry,
    priority: nextPriority++,
  }))
}
