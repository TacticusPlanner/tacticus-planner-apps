import { holdsGlobalPosition } from "@/entities/goal"

export type PortraitUnit = { entityType: string; entityId: string }

/** How many unit portraits a project card shows before "+N" (add-project-unit-portraits). */
const PROJECT_PORTRAIT_LIMIT = 4

/**
 * The distinct units among a project's in-flight (Active/Paused) goals, ordered by the global
 * priority of each unit's highest goal, capped to `limit`. Built from the goals the card already
 * joins, so it costs no read. A goal without a position sorts last, stably.
 */
export function projectPortraitUnits(
  goals: readonly {
    entityType: string
    entityId: string
    status: string
    globalPriority: number | null
  }[],
  limit = PROJECT_PORTRAIT_LIMIT
): PortraitUnit[] {
  const best = new Map<string, { unit: PortraitUnit; priority: number }>()
  for (const goal of goals) {
    if (!holdsGlobalPosition(goal)) continue
    const key = `${goal.entityType}:${goal.entityId}`
    const priority = goal.globalPriority ?? Number.MAX_SAFE_INTEGER
    const current = best.get(key)
    if (current === undefined || priority < current.priority) {
      best.set(key, {
        unit: { entityType: goal.entityType, entityId: goal.entityId },
        priority,
      })
    }
  }
  return [...best.values()]
    .toSorted((left, right) => left.priority - right.priority)
    .slice(0, limit)
    .map(({ unit }) => unit)
}
