import { useCallback, useMemo } from "react"
import { hasLegendaryEventsSynced } from "@workspace/game-catalog/queries"

import { combineReadStates } from "@/shared/lib"
import { useCatalogDataset } from "@/shared/local-data"

import {
  deriveLegendaryEventLifecycle,
  legendaryEventLifecycleSignature,
} from "../lib/lifecycle"
import type { LegendaryEvent, LegendaryEventLifecycle } from "./types"
import { readMinuteNow, useMinuteNow } from "./use-minute-now"
import { useReadState, type ReadState } from "./use-read-state"

export type LegendaryEventState = ReadState<LegendaryEvent | undefined> & {
  /** The instant `lifecycle` is evaluated at: the minute clock as of this render. */
  nowMs: number
  /** The event's lifecycle at `nowMs`, once the event is known. */
  lifecycle: LegendaryEventLifecycle | undefined
  /** Whether `lres` has synced at least once: an absent event only means "unknown id" once it has. */
  catalogSynced: boolean
}

/** One catalog Legendary Event by id (`data` is `undefined` for an unknown id). The host
 *  re-renders on a minute tick only when the event's lifecycle flips; a countdown reads its own
 *  `useMinuteNow()`. */
export function useLegendaryEvent(eventId: string): LegendaryEventState {
  const select = useCallback(
    (events: LegendaryEvent[]) => events.find((event) => event.id === eventId),
    [eventId]
  )
  const state = combineReadStates(
    useCatalogDataset("lres", select),
    useReadState("lres-synced", hasLegendaryEventsSynced, [])
  )
  const event = state.status === "ready" ? state.data[0] : undefined
  const signatureAt = useCallback(
    (nowMs: number) =>
      event ? legendaryEventLifecycleSignature(event, nowMs) : "",
    [event]
  )
  useMinuteNow(signatureAt)
  const nowMs = readMinuteNow()

  const lifecycle = useMemo(
    () => (event ? deriveLegendaryEventLifecycle(event, nowMs) : undefined),
    [event, nowMs]
  )

  if (state.status !== "ready") {
    return { ...state, nowMs, lifecycle: undefined, catalogSynced: false }
  }
  const [data, catalogSynced] = state.data
  return {
    status: "ready",
    data,
    retry: state.retry,
    nowMs,
    lifecycle,
    catalogSynced,
  }
}
