import type { LegendaryEventAnnotationStatus } from "@/entities/legendary-event"

/**
 * The cells a Next token card action marks (design D5): Couldn't clear marks every cell the token
 * clears Stop here; Partly cleared marks its objective cells Maybe clear, or its defeat-all cell
 * when it clears no objective.
 */
export function tokenMarkIds(
  clearedIds: readonly number[],
  status: LegendaryEventAnnotationStatus
): number[] {
  if (status === "stopHere") return [...clearedIds]
  const objectives = clearedIds.filter((id) => id > 0)
  return objectives.length > 0
    ? objectives
    : clearedIds.filter((id) => id === 0)
}
