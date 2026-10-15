import {
  LEGENDARY_EVENT_LANE_IDS,
  type LegendaryEventAnnotation,
  type LegendaryEventAnnotationStatus,
  type LegendaryEventLaneId,
  type LegendaryEventPlan,
} from "@/entities/legendary-event"

/** The not-cleared cell ids of a battle (0 defeat-all, 1–5 objective index + 1): the cells a
 *  battle-row action marks. */
export function notClearedObjectiveIds(cleared: readonly boolean[]): number[] {
  return cleared.flatMap((isCleared, id) => (isCleared ? [] : [id]))
}

/** Whether every listed cell of the battle already stores `status` (null: no mark), so a write
 *  would change nothing. */
export function annotationsUnchanged(
  annotations: readonly LegendaryEventAnnotation[] | undefined,
  laneId: LegendaryEventLaneId,
  battleIndex: number,
  objectiveIds: readonly number[],
  status: LegendaryEventAnnotationStatus | null
): boolean {
  return objectiveIds.every((objectiveId) => {
    const stored = annotations?.find(
      (annotation) =>
        annotation.laneId === laneId &&
        annotation.battleIndex === battleIndex &&
        annotation.objectiveId === objectiveId
    )
    return (stored?.status ?? null) === status
  })
}

const laneOrder = (laneId: LegendaryEventLaneId) =>
  LEGENDARY_EVENT_LANE_IDS.indexOf(laneId)

/** The plan with the listed cells of one battle set to `status` (or unmarked with null), ordered
 *  by lane, battle and objective the way the server serves them. */
export function withAnnotations(
  plan: LegendaryEventPlan,
  laneId: LegendaryEventLaneId,
  battleIndex: number,
  objectiveIds: readonly number[],
  status: LegendaryEventAnnotationStatus | null,
  updatedAt: string
): LegendaryEventPlan {
  const kept = (plan.annotations ?? []).filter(
    (annotation) =>
      annotation.laneId !== laneId ||
      annotation.battleIndex !== battleIndex ||
      !objectiveIds.includes(annotation.objectiveId)
  )
  const added: LegendaryEventAnnotation[] =
    status === null
      ? []
      : objectiveIds.map((objectiveId) => ({
          laneId,
          battleIndex,
          objectiveId,
          status,
          updatedAt,
        }))
  return {
    ...plan,
    annotations: [...kept, ...added].sort(
      (a, b) =>
        laneOrder(a.laneId) - laneOrder(b.laneId) ||
        a.battleIndex - b.battleIndex ||
        a.objectiveId - b.objectiveId
    ),
  }
}
