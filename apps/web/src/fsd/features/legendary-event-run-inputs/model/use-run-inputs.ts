import { useEffect, useRef, useState } from "react"
import { useTranslation } from "react-i18next"
import { useQueryClient } from "@tanstack/react-query"

import {
  legendaryEventPlanQueries,
  runInputValues,
  updateLegendaryEventPlan,
  updateLegendaryEventRunInputs,
  usePlanWriteQueue,
  type LegendaryEventPlan,
  type LegendaryEventRun,
  type LegendaryEventRunInputValues,
  type PlanMutationOutcome,
} from "@/entities/legendary-event"
import { useAnalyticsActions } from "@/shared/analytics"

import { sameRunInputValues, withRunInputs } from "./run-inputs-patches"

/** How long a run's values must stay unchanged before they are saved (design D4). */
export const RUN_INPUTS_SETTLE_MS = 600

type Drafts = Partial<Record<LegendaryEventRun, LegendaryEventRunInputValues>>

/**
 * The run inputs of one event's plan (design D4). Each run holds a local draft while it settles: a
 * change shows at once, and 600 ms after the last change to that run its values are sent as one
 * `PUT …/runs/{run}` through the shared plan write queue (nothing is sent when they equal the stored
 * ones). The write applies optimistically, so the draft is dropped when it is queued: the drawer then
 * reads the cached plan, which becomes the returned plan on success, the adopted plan on a conflict
 * (re-seeding the drawer) and the stored values again on any other error (with a translated toast).
 * Paid values are kept whatever Show paid options says. A draft still settling when the drawer
 * unmounts is saved at once.
 */
export function useRunInputs(eventId: string) {
  const { t } = useTranslation("legendaryEvents")
  const queryClient = useQueryClient()
  const { captureEvent } = useAnalyticsActions()
  const { query, enabled, pending, enqueue } = usePlanWriteQueue(eventId)
  const queryKey = legendaryEventPlanQueries.detail(eventId).queryKey
  const plan = query.data
  // The drafts live in a ref (read by the settle timers) mirrored into state (for rendering).
  const drafts = useRef<Drafts>({})
  const [shownDrafts, setShownDrafts] = useState<Drafts>({})
  const timers = useRef<Partial<Record<LegendaryEventRun, number>>>({})

  const setDraft = (
    run: LegendaryEventRun,
    values: LegendaryEventRunInputValues | undefined
  ) => {
    const next = { ...drafts.current }
    if (values) next[run] = values
    else delete next[run]
    drafts.current = next
    setShownDrafts(next)
  }

  const settle = (run: LegendaryEventRun): Promise<PlanMutationOutcome> => {
    const timer = timers.current[run]
    if (timer !== undefined) window.clearTimeout(timer)
    delete timers.current[run]
    const values = drafts.current[run]
    if (!values) return Promise.resolve("skipped")
    setDraft(run, undefined)
    const cached = queryClient.getQueryData<LegendaryEventPlan>(queryKey)
    if (!cached || sameRunInputValues(runInputValues(cached.runs, run), values))
      return Promise.resolve("skipped")
    return enqueue({
      patch: (current) =>
        withRunInputs(current, run, values, new Date().toISOString()),
      send: (base) =>
        updateLegendaryEventRunInputs(eventId, run, {
          expectedRevision: base.revision,
          ...values,
        }),
      onSaved: () =>
        captureEvent({
          type: "legendary_event_run_inputs_saved",
          eventId,
          run,
          ...values,
        }),
      errorMessage: t("runInputs.toasts.error"),
    })
  }

  // The latest `settle` for the unmount flush below (it closes over the current query client).
  const settleRef = useRef(settle)
  useEffect(() => {
    settleRef.current = settle
  })
  useEffect(
    () => () => {
      for (const run of Object.keys(timers.current)) {
        void settleRef.current(Number(run) as LegendaryEventRun)
      }
    },
    []
  )

  /** The values `run` shows: its settling draft, else the cached plan's (zeros when absent). */
  const values = (run: LegendaryEventRun): LegendaryEventRunInputValues =>
    shownDrafts[run] ?? runInputValues(plan?.runs, run)

  /** Changes some of `run`'s values at once and (re)starts its settle timer. */
  const change = (
    run: LegendaryEventRun,
    patch: Partial<LegendaryEventRunInputValues>
  ) => {
    const current =
      drafts.current[run] ??
      runInputValues(
        queryClient.getQueryData<LegendaryEventPlan>(queryKey)?.runs,
        run
      )
    setDraft(run, { ...current, ...patch })
    const timer = timers.current[run]
    if (timer !== undefined) window.clearTimeout(timer)
    timers.current[run] = window.setTimeout(() => {
      void settle(run)
    }, RUN_INPUTS_SETTLE_MS)
  }

  /** Writes the plan's Show paid options with its notes unchanged. */
  const setShowPaidOptions = (on: boolean) =>
    enqueue({
      patch: (current) => ({ ...current, showPaidOptions: on }),
      send: (base) =>
        updateLegendaryEventPlan(eventId, {
          expectedRevision: base.revision,
          notes: base.notes,
          showPaidOptions: on,
        }),
      onSaved: () =>
        captureEvent({
          type: "legendary_event_paid_options_toggled",
          eventId,
          on,
        }),
      errorMessage: t("runInputs.toasts.error"),
    })

  return {
    enabled,
    /** The plan is still loading (the drawer shows a skeleton). */
    loading: enabled && query.isPending,
    failed: query.isError,
    pending,
    showPaidOptions: plan?.showPaidOptions ?? false,
    values,
    change,
    setShowPaidOptions,
  }
}

export type RunInputsActions = ReturnType<typeof useRunInputs>
