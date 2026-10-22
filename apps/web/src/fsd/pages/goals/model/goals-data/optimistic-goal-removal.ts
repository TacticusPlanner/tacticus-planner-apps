/** Removes a goal from the cached goal lists, leaving detail and unrelated caches intact. */
export function applyOptimisticGoalRemoval(
  data: unknown,
  goalId: string
): unknown {
  if (!data || typeof data !== "object" || !("goals" in data)) return data
  if (!Array.isArray(data.goals)) return data

  const goals = data.goals.filter((entry: unknown) => {
    if (!entry || typeof entry !== "object") return true
    return !("goalId" in entry) || entry.goalId !== goalId
  })
  return goals.length === data.goals.length ? data : { ...data, goals }
}
