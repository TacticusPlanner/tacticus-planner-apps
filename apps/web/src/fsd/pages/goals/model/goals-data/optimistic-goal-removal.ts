/** Removes a goal from flat and project-membership lists, leaving detail and unrelated caches intact. */
export function applyOptimisticGoalRemoval(
  data: unknown,
  goalId: string
): unknown {
  if (!data || typeof data !== "object" || !("goals" in data)) return data
  if (!Array.isArray(data.goals)) return data

  const goals = data.goals.filter((entry: unknown) => {
    if (!entry || typeof entry !== "object") return true
    const goal = "goal" in entry ? entry.goal : entry
    return (
      !goal ||
      typeof goal !== "object" ||
      !("goalId" in goal) ||
      goal.goalId !== goalId
    )
  })
  return goals.length === data.goals.length ? data : { ...data, goals }
}
