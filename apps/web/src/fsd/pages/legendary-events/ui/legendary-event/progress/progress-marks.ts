import {
  annotationCellKey,
  applicableAnnotations,
  type BattleProgressView,
  type LegendaryEventAnnotation,
  type LegendaryEventAnnotationStatus,
  type LegendaryEventLaneId,
  type LegendaryEventProgress,
} from "@/entities/legendary-event"

/** The marks in effect per lane, keyed by `annotationCellKey` (cleared cells already dropped). */
export type MarksByLane = Record<
  LegendaryEventLaneId,
  ReadonlyMap<string, LegendaryEventAnnotationStatus>
>

/** The Synced progress grid's marks (design D9): editable for a signed-in user whose plan has
 *  loaded, with the write actions of the marks feature. */
export interface ProgressMarksViewModel {
  editable: boolean
  byLane: MarksByLane
  onMarkCell: (
    laneId: LegendaryEventLaneId,
    battleIndex: number,
    objectiveId: number,
    status: LegendaryEventAnnotationStatus | null
  ) => void
  onMarkBattle: (
    laneId: LegendaryEventLaneId,
    battle: Pick<BattleProgressView, "index" | "cleared">,
    status: LegendaryEventAnnotationStatus | null
  ) => void
}

/** One lane's slice of the marks, as the grid and the rows read it. */
export interface LaneMarks {
  statusAt: (
    battleIndex: number,
    objectiveId: number
  ) => LegendaryEventAnnotationStatus | null
  onMarkCell: (
    battleIndex: number,
    objectiveId: number,
    status: LegendaryEventAnnotationStatus | null
  ) => void
  onMarkBattle: (
    battle: Pick<BattleProgressView, "index" | "cleared">,
    status: LegendaryEventAnnotationStatus | null
  ) => void
}

/** The plan's annotations reduced to the marks in effect on each lane's synced record. */
export function buildMarksByLane(
  annotations: readonly LegendaryEventAnnotation[] | undefined,
  progress: LegendaryEventProgress | undefined
): MarksByLane {
  const lane = (laneId: LegendaryEventLaneId) =>
    new Map(
      applicableAnnotations(annotations, laneId, progress?.[laneId]).map(
        (annotation) => [
          annotationCellKey(annotation.battleIndex, annotation.objectiveId),
          annotation.status,
        ]
      )
    )
  return { alpha: lane("alpha"), beta: lane("beta"), gamma: lane("gamma") }
}

export function laneMarks(
  marks: ProgressMarksViewModel,
  laneId: LegendaryEventLaneId
): LaneMarks {
  const byCell = marks.byLane[laneId]
  return {
    statusAt: (battleIndex, objectiveId) =>
      byCell.get(annotationCellKey(battleIndex, objectiveId)) ?? null,
    onMarkCell: (battleIndex, objectiveId, status) =>
      marks.onMarkCell(laneId, battleIndex, objectiveId, status),
    onMarkBattle: (battle, status) =>
      marks.onMarkBattle(laneId, battle, status),
  }
}
