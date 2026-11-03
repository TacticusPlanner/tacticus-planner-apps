import { useTranslation } from "react-i18next"

import {
  updateLegendaryEventPlan,
  usePlanWriteQueue,
  type PlanMutationOutcome,
} from "@/entities/legendary-event"
import { useAnalyticsActions } from "@/shared/analytics"

import { normalizePlanNotes, planNotesChanged } from "./plan-notes"

/**
 * The free-text notes of one event's plan. `save` writes them as one optimistic `PUT …/{eventId}`
 * through the shared plan write queue, keeping Show paid options as stored (a 409 adopts the
 * returned plan with the "reloaded" toast, any other error rolls back with a translated toast).
 * Nothing is sent when the draft equals the stored notes; a blank draft clears them.
 */
export function usePlanNotes(eventId: string) {
  const { t } = useTranslation("legendaryEvents")
  const { captureEvent } = useAnalyticsActions()
  const { query, enabled, enqueue } = usePlanWriteQueue(eventId)
  const stored = query.data?.notes ?? null

  const save = (draft: string): Promise<PlanMutationOutcome> => {
    if (!planNotesChanged(stored, draft)) return Promise.resolve("skipped")
    const notes = normalizePlanNotes(draft)
    return enqueue({
      patch: (plan) => ({ ...plan, notes }),
      send: (base) =>
        updateLegendaryEventPlan(eventId, {
          expectedRevision: base.revision,
          notes,
          showPaidOptions: base.showPaidOptions,
        }),
      onSaved: () =>
        captureEvent({
          type: "legendary_event_notes_saved",
          eventId,
          length: notes?.length ?? 0,
        }),
      errorMessage: t("notes.toasts.error"),
    })
  }

  return {
    enabled,
    state: notesState(query),
    notes: stored ?? "",
    save,
  }
}

function notesState(query: {
  isPending: boolean
  isError: boolean
}): "loading" | "error" | "ready" {
  if (query.isPending) return "loading"
  if (query.isError) return "error"
  return "ready"
}
