import { useCallback } from "react"
import { hasLegendaryEventsSynced } from "@workspace/game-catalog/queries"

import { combineReadStates } from "@/shared/lib"
import { useCatalogDataset } from "@/shared/local-data"

import { deriveLegendaryEventLifecycle } from "../lib/lifecycle"
import type { LegendaryEvent, LegendaryEventLifecycle } from "./types"
import { useMinuteNow } from "./use-minute-now"
import { useReadState, type ReadState } from "./use-read-state"

export type LegendaryEventState = ReadState<LegendaryEvent | undefined> & {
  nowMs: number
  /** The event's lifecycle at `nowMs`, once the event is known. */
  lifecycle: LegendaryEventLifecycle | undefined
  /** Whether `lres` has synced at least once: an absent event only means "unknown id" once it has. */
  catalogSynced: boolean
}

/** One catalog Legendary Event by id (`data` is `undefined` for an unknown id), with its
 *  lifecycle re-evaluated once a minute. */
export function useLegendaryEvent(eventId: string): LegendaryEventState {
  const nowMs = useMinuteNow()
  const select = useCallback(
    (events: LegendaryEvent[]) => events.find((event) => event.id === eventId),
    [eventId]
  )
  const state = combineReadStates(
    useCatalogDataset("lres", select),
    useReadState("lres-synced", hasLegendaryEventsSynced, [])
  )

  if (state.status !== "ready") {
    return { ...state, nowMs, lifecycle: undefined, catalogSynced: false }
  }
  const [event, catalogSynced] = state.data
  return {
    status: "ready",
    data: event,
    retry: state.retry,
    nowMs,
    lifecycle: event ? deriveLegendaryEventLifecycle(event, nowMs) : undefined,
    catalogSynced,
  }
}
