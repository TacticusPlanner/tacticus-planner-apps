import { useTranslation } from "react-i18next"
import { useQueryClient } from "@tanstack/react-query"

import {
  legendaryEventPlanQueries,
  updateLegendaryEventAnnotations,
  usePlanWriteQueue,
  type LegendaryEventAnnotationStatus,
  type LegendaryEventLaneId,
  type LegendaryEventPlan,
  type PlanMutationOutcome,
} from "@/entities/legendary-event"
import { useAnalyticsActions } from "@/shared/analytics"

import {
  annotationsUnchanged,
  notClearedObjectiveIds,
  withAnnotations,
} from "./annotation-patches"

/**
 * Maybe clear / Stop here marks of one event's plan (design D9). `markCell` sets one cell and
 * `markBattle` every not-cleared cell of a battle; each action is one optimistic `PUT …/annotations`
 * through the shared plan write queue (a 409 adopts the returned plan with the "reloaded" toast,
 * any other error rolls back with a translated toast). Nothing is sent when the cells already hold
 * the status. `markToken` sets the cells of one planned token (the Next token card's actions).
 */
export function useAnnotations(eventId: string) {
  const { t } = useTranslation("legendaryEvents")
  const queryClient = useQueryClient()
  const { captureEvent } = useAnalyticsActions()
  const { query, enabled, enqueue } = usePlanWriteQueue(eventId)
  const queryKey = legendaryEventPlanQueries.detail(eventId).queryKey

  const write = (
    laneId: LegendaryEventLaneId,
    battleIndex: number,
    objectiveIds: number[],
    status: LegendaryEventAnnotationStatus | null,
    scope: "cell" | "battle" | "token"
  ): Promise<PlanMutationOutcome> => {
    const cached = queryClient.getQueryData<LegendaryEventPlan>(queryKey)
    if (
      objectiveIds.length === 0 ||
      annotationsUnchanged(
        cached?.annotations,
        laneId,
        battleIndex,
        objectiveIds,
        status
      )
    ) {
      return Promise.resolve("skipped")
    }
    return enqueue({
      patch: (plan) =>
        withAnnotations(
          plan,
          laneId,
          battleIndex,
          objectiveIds,
          status,
          new Date().toISOString()
        ),
      send: (base) =>
        updateLegendaryEventAnnotations(eventId, {
          expectedRevision: base.revision,
          laneId,
          battleIndex,
          objectiveIds,
          status,
        }),
      onSaved: () =>
        captureEvent({
          type: "legendary_event_annotation_set",
          eventId,
          laneId,
          battleIndex,
          cellCount: objectiveIds.length,
          status,
          scope,
        }),
      errorMessage: t("annotations.toasts.error"),
    })
  }

  /** Marks (or unmarks, with null) one not-cleared cell. */
  const markCell = (
    laneId: LegendaryEventLaneId,
    battleIndex: number,
    objectiveId: number,
    status: LegendaryEventAnnotationStatus | null
  ) => write(laneId, battleIndex, [objectiveId], status, "cell")

  /** Marks (or clears, with null) every not-cleared cell of a battle; cleared cells are left out. */
  const markBattle = (
    laneId: LegendaryEventLaneId,
    battle: { index: number; cleared: readonly boolean[] },
    status: LegendaryEventAnnotationStatus | null
  ) =>
    write(
      laneId,
      battle.index,
      notClearedObjectiveIds(battle.cleared),
      status,
      "battle"
    )

  /** Marks the cells a planned token clears (the Next token card's actions): one write. */
  const markToken = (
    laneId: LegendaryEventLaneId,
    battleIndex: number,
    objectiveIds: readonly number[],
    status: LegendaryEventAnnotationStatus
  ) => write(laneId, battleIndex, [...objectiveIds], status, "token")

  return {
    enabled,
    annotations: query.data?.annotations,
    markCell,
    markBattle,
    markToken,
  }
}
