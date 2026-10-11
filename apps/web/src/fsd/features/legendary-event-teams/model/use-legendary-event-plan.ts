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
    type:
      | "legendary_event_team_created"
      | "legendary_event_team_edited"
      | "legendary_event_team_deleted",
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

  const createTeam = (laneId: LegendaryEventLaneId, draft: TeamDraft) =>
    enqueue({
      send: (base) =>
        createLegendaryEventTeam(
          eventId,
          teamCreateRequest(laneId, draft, run, base.revision)
        ),
      onSaved: () =>
        teamAnalytics("legendary_event_team_created", laneId, draft),
    })

  const updateTeam = (team: LegendaryEventTeam, draft: TeamDraft) =>
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
      onSaved: () =>
        teamAnalytics("legendary_event_team_edited", team.laneId, draft),
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

  /** Sets (or clears, with null) the team's depth for the current run, as a manual value. */
  const setDepth = (team: LegendaryEventTeam, depth: number | null) =>
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
      onSaved: () =>
        captureEvent({
          type: "legendary_event_depth_set",
          eventId,
          laneId: team.laneId,
          depth,
        }),
    })

  return {
    query,
    enabled,
    pending,
    createTeam,
    updateTeam,
    deleteTeam,
    reorderLane,
    setDepth,
  }
}

export type LegendaryEventPlanActions = ReturnType<typeof useLegendaryEventPlan>
