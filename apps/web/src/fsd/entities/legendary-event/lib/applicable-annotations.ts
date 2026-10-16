import type { LegendaryEventAnnotation } from "../model/plan.types"
import type {
  LegendaryEventLaneId,
  LegendaryEventLaneRecord,
} from "../model/types"

/** A stable key for one objective cell of a lane: `battleIndex:objectiveId`. */
export function annotationCellKey(
  battleIndex: number,
  objectiveId: number
): string {
  return `${battleIndex}:${objectiveId}`
}

/**
 * The marks in effect on one lane (design D9): the plan's annotations for `laneId` whose cell the
 * synced lane shows not cleared. A mark on a cleared cell is dropped (never deleted: the stale row
 * stays on the plan, ignored), so a complete battle has none. A lane with no synced record (no entry
 * for the event, or a null lane) has no cells and so no marks. The grid, its legend and Stage 4's
 * token plan all read this result.
 */
export function applicableAnnotations(
  annotations: readonly LegendaryEventAnnotation[] | undefined,
  laneId: LegendaryEventLaneId,
  syncedLane: LegendaryEventLaneRecord | null | undefined
): LegendaryEventAnnotation[] {
  if (!annotations || !syncedLane) return []
  return annotations.filter((annotation) => {
    if (annotation.laneId !== laneId) return false
    const cleared =
      syncedLane.encounters[annotation.battleIndex]?.objectivesCleared ?? []
    return !cleared.includes(annotation.objectiveId)
  })
}
