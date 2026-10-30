import type { RaidBreakdownEntry } from "@/features/goal-farming/@x/daily-raids"

import type { DailyRaidResourceUrgency } from "./daily-raids.domain"

/**
 * Combine goals: Today's entries in one combined order, by their resource's pooled urgency: most
 * energy to clear first, as Insights ranks its bottlenecks, then longest to finish. A resource without
 * an urgency goes last; ties keep the run's own order, and a resource's entries stay together.
 */
export function orderCombinedEntries<Entry extends RaidBreakdownEntry>(
  entries: readonly Entry[],
  urgencyByResource: ReadonlyMap<string, DailyRaidResourceUrgency>
): Entry[] {
  const firstIndex = new Map<string, number>()
  for (const [index, entry] of entries.entries()) {
    if (!firstIndex.has(entry.resourceId)) {
      firstIndex.set(entry.resourceId, index)
    }
  }
  return [...entries].sort((left, right) => {
    const leftUrgency = urgencyByResource.get(left.resourceId)
    const rightUrgency = urgencyByResource.get(right.resourceId)
    const byEnergy =
      (rightUrgency?.energyTotal ?? -1) - (leftUrgency?.energyTotal ?? -1)
    if (byEnergy !== 0) return byEnergy
    const byDays = (rightUrgency?.days ?? -1) - (leftUrgency?.days ?? -1)
    if (byDays !== 0) return byDays
    return (
      (firstIndex.get(left.resourceId) ?? 0) -
      (firstIndex.get(right.resourceId) ?? 0)
    )
  })
}
