import { useRef, useState } from "react"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { useIsAuthenticated } from "@azure/msal-react"

import {
  createLegendaryEventTeam,
  deleteLegendaryEventTeam,
  legendaryEventPlanConflictDetails,
  legendaryEventPlanQueries,
  updateLegendaryEventTeam,
  updateLegendaryEventTeamOrder,
  type LegendaryEventLaneId,
  type LegendaryEventPlan,
  type LegendaryEventRun,
  type LegendaryEventTeam,
} from "@/entities/legendary-event"
import { useAnalyticsActions } from "@/shared/analytics"
import { ApiError } from "@/shared/api"

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

/** How a plan mutation ended: `saved` (the returned plan is adopted), `conflict` (the plan changed
 *  elsewhere and was reloaded from the 409 body), `error` (rolled back) or `skipped` (nothing sent:
 *  no plan loaded, nothing changed, or an earlier conflict discarded it). */
export type PlanMutationOutcome = "saved" | "conflict" | "error" | "skipped"

type Patch = (plan: LegendaryEventPlan) => LegendaryEventPlan

type Operation = {
  /** Applied to the cache at once (optimistic); none for create/update, which wait for the server
   *  because it assigns ids and validates. */
  patch?: Patch
  /** Sends the request against the last server-confirmed plan. */
  send: (base: LegendaryEventPlan) => Promise<LegendaryEventPlan>
  onSaved?: (plan: LegendaryEventPlan) => void
}

/**
 * The plan of one event and its mutations (design D2). One query per event, enabled when signed
 * in. Every mutation is queued so requests go out one at a time, each with the revision of the
 * plan the previous one returned, and the returned plan is adopted. Reorder, delete and a card's
 * depth change apply optimistically and roll back on failure. A 409 carrying the plan
 * (`legendaryEventPlanStale` / `legendaryEventOrderSetMismatch`) adopts that plan, shows one
 * "reloaded" toast, discards queued writes and never retries on its own; the caller (the editor)
 * keeps its draft.
 */
export function useLegendaryEventPlan({
  eventId,
  run,
}: {
  eventId: string
  run: LegendaryEventRun
}) {
  const { t } = useTranslation("legendaryEvents")
  const isAuthenticated = useIsAuthenticated()
  const queryClient = useQueryClient()
  const { captureEvent } = useAnalyticsActions()
  const queryKey = legendaryEventPlanQueries.detail(eventId).queryKey
  const query = useQuery({
    ...legendaryEventPlanQueries.detail(eventId),
    enabled: isAuthenticated,
  })
  const queue = useRef<Promise<unknown>>(Promise.resolve())
  // The last plan the server returned; requests are built on it, never on optimistic state.
  const confirmed = useRef<LegendaryEventPlan | null>(null)
  const patches = useRef<{ id: number; patch: Patch }[]>([])
  const nextPatchId = useRef(0)
  const outstanding = useRef(0)
  // Bumped by a conflict: operations queued before it are dropped rather than replayed.
  const generation = useRef(0)
  const [pendingCount, setPendingCount] = useState(0)

  const show = (plan: LegendaryEventPlan) =>
    queryClient.setQueryData<LegendaryEventPlan>(
      queryKey,
      patches.current.reduce((current, entry) => entry.patch(current), plan)
    )

  const enqueue = (operation: Operation): Promise<PlanMutationOutcome> => {
    const cached = queryClient.getQueryData<LegendaryEventPlan>(queryKey)
    if (!isAuthenticated || !cached) return Promise.resolve("skipped")
    if (outstanding.current === 0) confirmed.current = cached
    const patchId = nextPatchId.current++
    if (operation.patch) {
      patches.current = [
        ...patches.current,
        { id: patchId, patch: operation.patch },
      ]
      queryClient.setQueryData(queryKey, operation.patch(cached))
    }
    const dropPatch = () => {
      patches.current = patches.current.filter((entry) => entry.id !== patchId)
    }
    const queuedIn = generation.current
    outstanding.current += 1
    setPendingCount((count) => count + 1)

    const outcome = queue.current.then(
      async (): Promise<PlanMutationOutcome> => {
        try {
          if (queuedIn !== generation.current || !confirmed.current) {
            return "skipped"
          }
          const plan = await operation.send(confirmed.current)
          confirmed.current = plan
          dropPatch()
          show(plan)
          operation.onSaved?.(plan)
          return "saved"
        } catch (error) {
          dropPatch()
          const conflict =
            error instanceof ApiError
              ? legendaryEventPlanConflictDetails(error.details)
              : null
          if (conflict) {
            generation.current += 1
            patches.current = []
            confirmed.current = conflict.plan
            show(conflict.plan)
            toast(t("teams.toasts.reloaded"))
            return "conflict"
          }
          if (confirmed.current) show(confirmed.current)
          toast.error(
            error instanceof ApiError ? error.message : t("teams.toasts.error")
          )
          return "error"
        } finally {
          outstanding.current -= 1
          setPendingCount((count) => Math.max(0, count - 1))
        }
      }
    )
    queue.current = outcome
    return outcome
  }

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
          laneId: team.laneId,
          depth,
        }),
    })

  return {
    query,
    enabled: isAuthenticated,
    pending: pendingCount > 0,
    createTeam,
    updateTeam,
    deleteTeam,
    reorderLane,
    setDepth,
  }
}

export type LegendaryEventPlanActions = ReturnType<typeof useLegendaryEventPlan>
