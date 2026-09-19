import type { GoalRow } from "./types"

/**
 * A Level goal that exactly one other in-flight goal `DependsOn`s renders as that goal's sub-line,
 * not its own row (add-inline-goal-reprioritize, folded in from Cluster 7's Level-goal decision).
 * `GoalType.Level` stays a real, independently addressable goal — only its list-row rendering merges
 * into its dependent's. Returns the Level goal id -> its sole dependent's goal id, for every Level
 * goal in `rows` that has exactly one dependent (also in `rows`); a Level goal with no dependent, or
 * more than one, is omitted and falls back to rendering as its own row.
 */
export function computeLevelMerges(rows: GoalRow[]): Map<string, string> {
  const levelGoalIds = new Set(
    rows.filter((row) => row.goalType === "Level").map((row) => row.goalId)
  )
  const dependentsByLevelGoalId = new Map<string, string[]>()
  for (const row of rows) {
    for (const dependsOnId of row.dependsOn ?? []) {
      if (!levelGoalIds.has(dependsOnId)) continue
      const dependents = dependentsByLevelGoalId.get(dependsOnId) ?? []
      dependents.push(row.goalId)
      dependentsByLevelGoalId.set(dependsOnId, dependents)
    }
  }

  const parentByLevelGoalId = new Map<string, string>()
  for (const [levelGoalId, dependents] of dependentsByLevelGoalId) {
    if (dependents.length === 1) {
      parentByLevelGoalId.set(levelGoalId, dependents[0]!)
    }
  }
  return parentByLevelGoalId
}

/** Excludes a merged Level goal's own row — its content renders only as its dependent's sub-line. */
export function excludeMergedLevelGoals(
  rows: GoalRow[],
  parentByLevelGoalId: ReadonlyMap<string, string>
): GoalRow[] {
  return rows.filter((row) => !parentByLevelGoalId.has(row.goalId))
}

/** Level goal id, keyed by its dependent's goal id — the shape row-rendering actually needs (look up
 *  "does this row I'm rendering have an attached Level goal?"). */
export function levelGoalIdByParent(
  parentByLevelGoalId: ReadonlyMap<string, string>
): Map<string, string> {
  return new Map(
    [...parentByLevelGoalId.entries()].map(([levelGoalId, parentId]) => [
      parentId,
      levelGoalId,
    ])
  )
}
