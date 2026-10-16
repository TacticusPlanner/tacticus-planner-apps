import { useSyncExternalStore } from "react"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"
import {
  useQuery,
  useQueryClient,
  type QueryClient,
} from "@tanstack/react-query"
import { useIsAuthenticated } from "@azure/msal-react"

import { ApiError } from "@/shared/api"

import { legendaryEventPlanQueries } from "../api/legendary-event-plan.queries"
import {
  legendaryEventPlanConflictDetails,
  type LegendaryEventPlan,
} from "./plan.types"

/** How a plan mutation ended: `saved` (the returned plan is adopted), `conflict` (the plan changed
 *  elsewhere and was reloaded — from this write's 409 body, or from an earlier queued write's,
 *  which discarded this one unsent), `error` (rolled back) or `skipped` (nothing sent: no plan
 *  loaded or nothing changed). */
export type PlanMutationOutcome = "saved" | "conflict" | "error" | "skipped"

export type PlanPatch = (plan: LegendaryEventPlan) => LegendaryEventPlan

export interface PlanWriteOperation {
  /** Applied to the cache at once (optimistic); none for writes that wait for the server (a team
   *  create/update, because the server assigns ids and validates). */
  patch?: PlanPatch
  /** Sends the request against the last server-confirmed plan. */
  send: (base: LegendaryEventPlan) => Promise<LegendaryEventPlan>
  onSaved?: (plan: LegendaryEventPlan) => void
  /** The translated toast for a failure other than a conflict; the Teams copy when omitted. */
  errorMessage?: string
}

/** One event's queue, shared by every hook instance on the same query client, so team, run input
 *  and mark writes from different sections never race each other. */
interface PlanWriteQueueState {
  tail: Promise<unknown>
  /** The last plan the server returned; requests are built on it, never on optimistic state. */
  confirmed: LegendaryEventPlan | null
  patches: { id: number; patch: PlanPatch }[]
  nextPatchId: number
  outstanding: number
  /** Bumped by a conflict: operations queued before it are dropped rather than replayed. */
  generation: number
  listeners: Set<() => void>
}

const queues = new WeakMap<QueryClient, Map<string, PlanWriteQueueState>>()

function planWriteQueueState(
  queryClient: QueryClient,
  eventId: string
): PlanWriteQueueState {
  let byEvent = queues.get(queryClient)
  if (!byEvent) {
    byEvent = new Map()
    queues.set(queryClient, byEvent)
  }
  let state = byEvent.get(eventId)
  if (!state) {
    state = {
      tail: Promise.resolve(),
      confirmed: null,
      patches: [],
      nextPatchId: 0,
      outstanding: 0,
      generation: 0,
      listeners: new Set(),
    }
    byEvent.set(eventId, state)
  }
  return state
}

function setOutstanding(state: PlanWriteQueueState, delta: number) {
  state.outstanding = Math.max(0, state.outstanding + delta)
  for (const listener of state.listeners) listener()
}

/**
 * The plan of one event and its serialised write queue (design D1/D2 of the run inputs change; moved
 * unchanged from the Teams feature). One query per event, enabled when signed in. Every mutation is
 * queued so requests go out one at a time, each with the revision of the plan the previous one
 * returned, and the returned plan is adopted. An operation with a `patch` applies optimistically and
 * rolls back on failure. A 409 carrying the plan (`legendaryEventPlanStale` /
 * `legendaryEventOrderSetMismatch`) adopts that plan, shows one "reloaded" toast, discards queued
 * writes (they report `conflict` too) and never retries on its own. Before a write the plan query's
 * in-flight refetch is cancelled, and a refetch older than the cache never replaces it (see
 * `legendaryEventPlanQueries`), so the next write never carries a stale revision.
 */
export function usePlanWriteQueue(eventId: string) {
  const { t } = useTranslation("legendaryEvents")
  const isAuthenticated = useIsAuthenticated()
  const queryClient = useQueryClient()
  const queryKey = legendaryEventPlanQueries.detail(eventId).queryKey
  const query = useQuery({
    ...legendaryEventPlanQueries.detail(eventId),
    enabled: isAuthenticated,
  })
  const pending = useSyncExternalStore(
    (listener) => {
      const { listeners } = planWriteQueueState(queryClient, eventId)
      listeners.add(listener)
      return () => listeners.delete(listener)
    },
    () => planWriteQueueState(queryClient, eventId).outstanding > 0
  )

  const enqueue = (
    operation: PlanWriteOperation
  ): Promise<PlanMutationOutcome> => {
    // Looked up per write (not held across renders): the queue is mutable shared state.
    const state = planWriteQueueState(queryClient, eventId)
    // The plan list (master table) is a separate read of every plan: refreshed after each write.
    const invalidateList = () =>
      void queryClient.invalidateQueries({
        queryKey: legendaryEventPlanQueries.list().queryKey,
        exact: true,
      })
    const show = (plan: LegendaryEventPlan) =>
      queryClient.setQueryData<LegendaryEventPlan>(
        queryKey,
        state.patches.reduce((current, entry) => entry.patch(current), plan)
      )
    const cached = queryClient.getQueryData<LegendaryEventPlan>(queryKey)
    if (!isAuthenticated || !cached) return Promise.resolve("skipped")
    // A refetch landing after this point would overwrite the optimistic (or confirmed) plan.
    void queryClient.cancelQueries({ queryKey })
    if (state.outstanding === 0) state.confirmed = cached
    const patchId = state.nextPatchId++
    if (operation.patch) {
      state.patches = [
        ...state.patches,
        { id: patchId, patch: operation.patch },
      ]
      queryClient.setQueryData(queryKey, operation.patch(cached))
    }
    const dropPatch = () => {
      state.patches = state.patches.filter((entry) => entry.id !== patchId)
    }
    const queuedIn = state.generation
    setOutstanding(state, 1)

    const outcome = state.tail.then(async (): Promise<PlanMutationOutcome> => {
      try {
        // An earlier write's conflict reloaded the plan and discarded this one unsent.
        if (queuedIn !== state.generation) return "conflict"
        if (!state.confirmed) return "skipped"
        const plan = await operation.send(state.confirmed)
        state.confirmed = plan
        dropPatch()
        show(plan)
        invalidateList()
        operation.onSaved?.(plan)
        return "saved"
      } catch (error) {
        dropPatch()
        const conflict =
          error instanceof ApiError
            ? legendaryEventPlanConflictDetails(error.details)
            : null
        if (conflict) {
          state.generation += 1
          state.patches = []
          state.confirmed = conflict.plan
          show(conflict.plan)
          invalidateList()
          toast(t("teams.toasts.reloaded"))
          return "conflict"
        }
        if (state.confirmed) show(state.confirmed)
        // The server's message is English and technical: the toast stays translated.
        toast.error(operation.errorMessage ?? t("teams.toasts.error"))
        return "error"
      } finally {
        setOutstanding(state, -1)
      }
    })
    state.tail = outcome
    return outcome
  }

  return { query, enabled: isAuthenticated, pending, enqueue }
}

export type PlanWriteQueue = ReturnType<typeof usePlanWriteQueue>
