/**
 * A project's member goals, in the project's (global) order, joined from a goals-by-id map. Takes the
 * goals as input because this entity cannot import `entities/goal`; ids missing from the map are
 * skipped, so a map of non-archived goals yields the project's active members even though `goalIds`
 * may also list archived ones.
 */
export function projectGoals<TGoal>(
  project: { goalIds: readonly string[] },
  goalsById: ReadonlyMap<string, TGoal>
): TGoal[] {
  return project.goalIds.flatMap((goalId) => {
    const goal = goalsById.get(goalId)
    return goal === undefined ? [] : [goal]
  })
}
