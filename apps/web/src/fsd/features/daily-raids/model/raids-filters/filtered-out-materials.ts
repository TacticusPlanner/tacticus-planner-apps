import type { FilteredOutNeed } from "@/entities/goal-farming"

/** One material the applied Raids Filters left without an allowed node, with the goals waiting on
 *  it in plan priority order. `pinned` marks a material at least one goal pinned to an excluded
 *  location. */
export type FilteredOutMaterial = {
  resourceId: string
  goalIds: string[]
  pinned: boolean
}

/** Today's filtered-out needs grouped per material, in the order the plan first reports each one
 *  (goal priority), so the notice can list what is skipped and who waits on it. */
export function groupFilteredOutByMaterial(
  filteredOut: readonly FilteredOutNeed[]
): FilteredOutMaterial[] {
  const byResource = new Map<string, FilteredOutMaterial>()
  for (const need of filteredOut) {
    const row = byResource.get(need.resourceId) ?? {
      resourceId: need.resourceId,
      goalIds: [],
      pinned: false,
    }
    if (!row.goalIds.includes(need.goalId)) row.goalIds.push(need.goalId)
    if (need.pinned) row.pinned = true
    byResource.set(need.resourceId, row)
  }
  return [...byResource.values()]
}
