import { useTranslation } from "react-i18next"
import { toast } from "sonner"
import { useQueryClient } from "@tanstack/react-query"

import {
  createLegendaryEventTeam,
  deleteLegendaryEventTeam,
  legendaryEventPlanQueries,
  updateLegendaryEventTeam,
  updateLegendaryEventTeamOrder,
  usePlanWriteQueue,
  type LegendaryEventLaneId,
  type LegendaryEventPlan,
  type LegendaryEventRun,
  type LegendaryEventTeam,
  type PlanMutationOutcome,
} from "@/entities/legendary-event"
import { useAnalyticsActions } from "@/shared/analytics"

import {
  draftOfTeam,
  isCurrentLaneOrder,
  teamCreateRequest,
  teamUpdateRequest,
  withLaneOrder,
  withoutTeam,
  withTeamDepth,
  type TeamDraft,
} from "./plan-patches"

export type { PlanMutationOutcome }

/**
 * The plan of one event and its team mutations (design D2). The query, the serialised write queue,
 * optimistic patches and conflict adoption live in the entity's shared `usePlanWriteQueue`, so team
 * writes share one queue with the run inputs and mark writes of the same event. Reorder, delete and
 * a card's depth change apply optimistically and roll back on failure; create and update wait for
 * the server. On a conflict the caller (the editor) keeps its draft.
 */
export function useLegendaryEventPlan({
  eventId,
  run,
}: {
  eventId: string
  run: LegendaryEventRun
}) {
  const { t } = useTranslation("legendaryEvents")
  const queryClient = useQueryClient()
  const { captureEvent } = useAnalyticsActions()
  const queryKey = legendaryEventPlanQueries.detail(eventId).queryKey
  const { query, enabled, pending, enqueue } = usePlanWriteQueue(eventId)

  const teamAnalytics = (
    type: "legendary_event_team_edited" | "legendary_event_team_deleted",
    laneId: LegendaryEventLaneId,
    team: Pick<TeamDraft, "memberUnitIds" | "objectiveIndexes">
  ) =>
    captureEvent({
      type,
      eventId,
      laneId,
      memberCount: team.memberUnitIds.length,
      objectiveCount: team.objectiveIndexes.length,
    })

  /**
   * Logs a depth the editor saved as the card's depth events would (the override log, design D8):
   * clearing the depth while an estimate shows is Use estimate, any other change is a depth set.
   */
  const editorDepthAnalytics = (
    laneId: LegendaryEventLaneId,
    previous: number | null,
    depth: number | null,
    shown: DepthEstimateContext
  ) => {
    if (depth === previous) return
    if (depth === null && shown.estimate !== null) {
      captureEvent({
        type: "legendary_event_depth_estimate_restored",
        eventId,
        laneId,
        estimate: shown.estimate,
      })
      return
    }
    captureEvent({
      type: "legendary_event_depth_set",
      eventId,
      laneId,
      depth,
      estimate: shown.estimate,
      fromEstimate: shown.fromEstimate,
    })
  }

  const createTeam = (
    laneId: LegendaryEventLaneId,
    draft: TeamDraft,
    shown: DepthEstimateContext = noEstimateShown,
    origin: TeamOrigin = manualOrigin
  ) =>
    enqueue({
      send: (base) =>
        createLegendaryEventTeam(
          eventId,
          teamCreateRequest(laneId, draft, run, base.revision)
        ),
      onSaved: () => {
        captureEvent({
          type: "legendary_event_team_created",
          eventId,
          laneId,
          memberCount: draft.memberUnitIds.length,
          objectiveCount: draft.objectiveIndexes.length,
          source: origin.source,
          suggestionRank: origin.suggestionRank,
        })
        editorDepthAnalytics(laneId, null, draft.expectedBattleClears, shown)
      },
    })

  const updateTeam = (
    team: LegendaryEventTeam,
    draft: TeamDraft,
    shown: DepthEstimateContext = noEstimateShown
  ) =>
    enqueue({
      send: (base) =>
        updateLegendaryEventTeam(
          eventId,
          team.id,
          teamUpdateRequest(
            draft,
            run,
            base.revision,
            base.teams.find((entry) => entry.id === team.id) ?? team
          )
        ),
      onSaved: () => {
        teamAnalytics("legendary_event_team_edited", team.laneId, draft)
        editorDepthAnalytics(
          team.laneId,
          draftOfTeam(team, run).expectedBattleClears,
          draft.expectedBattleClears,
          shown
        )
      },
    })

  const deleteTeam = (team: LegendaryEventTeam) =>
    enqueue({
      patch: (plan) => withoutTeam(plan, team.id),
      send: (base) => deleteLegendaryEventTeam(eventId, team.id, base.revision),
      onSaved: () => {
        teamAnalytics("legendary_event_team_deleted", team.laneId, team)
        toast.success(t("teams.toasts.deleted", { name: team.name }))
      },
    })

  const reorderLane = (laneId: LegendaryEventLaneId, teamIds: string[]) => {
    const cached = queryClient.getQueryData<LegendaryEventPlan>(queryKey)
    if (cached && isCurrentLaneOrder(cached, laneId, teamIds)) {
      return Promise.resolve<PlanMutationOutcome>("skipped")
    }
    return enqueue({
      patch: (plan) => withLaneOrder(plan, laneId, teamIds),
      send: (base) =>
        updateLegendaryEventTeamOrder(eventId, {
          expectedRevision: base.revision,
          laneId,
          teamIds,
        }),
    })
  }

  /** Writes the team's depth for the current run (null clears it). */
  const writeDepth = (
    team: LegendaryEventTeam,
    depth: number | null,
    onSaved: () => void
  ) =>
    enqueue({
      patch: (plan) =>
        withTeamDepth(plan, team.id, run, depth, new Date().toISOString()),
      send: (base) => {
        const stored = base.teams.find((entry) => entry.id === team.id) ?? team
        return updateLegendaryEventTeam(
          eventId,
          team.id,
          teamUpdateRequest(
            { ...draftOfTeam(stored, run), expectedBattleClears: depth },
            run,
            base.revision,
            stored
          )
        )
      },
      onSaved,
    })

  /**
   * Sets (or clears, with null) the team's depth for the current run, as a manual value. The
   * analytics event carries the estimate shown at the time and whether the edit started from it
   * (the override log, design D8).
   */
  const setDepth = (
    team: LegendaryEventTeam,
    depth: number | null,
    shown: DepthEstimateContext = noEstimateShown
  ) =>
    writeDepth(team, depth, () =>
      captureEvent({
        type: "legendary_event_depth_set",
        eventId,
        laneId: team.laneId,
        depth,
        estimate: shown.estimate,
        fromEstimate: shown.fromEstimate,
      })
    )

  /** Use estimate: clears the current run's manual depth so the estimate shows again. */
  const restoreEstimate = (team: LegendaryEventTeam, estimate: number) =>
    writeDepth(team, null, () =>
      captureEvent({
        type: "legendary_event_depth_estimate_restored",
        eventId,
        laneId: team.laneId,
        estimate,
      })
    )

  return {
    query,
    enabled,
    pending,
    createTeam,
    updateTeam,
    deleteTeam,
    reorderLane,
    setDepth,
    restoreEstimate,
  }
}

/** The estimate shown when a depth was edited (null when none was shown). */
export interface DepthEstimateContext {
  estimate: number | null
  fromEstimate: boolean
}

/** Where a new team came from: the editor from scratch, or a team suggestion (1-based rank). */
export type TeamOrigin =
  | { source: "manual"; suggestionRank: null }
  | { source: "suggestion"; suggestionRank: number }

const manualOrigin: TeamOrigin = { source: "manual", suggestionRank: null }

const noEstimateShown: DepthEstimateContext = {
  estimate: null,
  fromEstimate: false,
}

export type LegendaryEventPlanActions = ReturnType<typeof useLegendaryEventPlan>
