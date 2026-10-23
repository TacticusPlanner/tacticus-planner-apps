import { useCallback, useMemo } from "react"

import { useCatalogDataset } from "@/shared/local-data"

import { legendaryEventLifecycleSignature } from "../lib/lifecycle"
import type { LegendaryEvent } from "./types"
import { readMinuteNow, useMinuteNow } from "./use-minute-now"
import type { ReadState } from "./use-read-state"

export type LegendaryEventsState = ReadState<LegendaryEvent[]> & {
  /** The instant lifecycle is evaluated at: the minute clock as of this render. */
  nowMs: number
}

/** Every catalog Legendary Event. The host re-renders on a minute tick only when some event's
 *  lifecycle flips; a countdown reads its own `useMinuteNow()`. */
export function useLegendaryEvents(): LegendaryEventsState {
  const state = useCatalogDataset("lres")
  const data = state.status === "ready" ? state.data : undefined
  const signatureAt = useCallback(
    (nowMs: number) =>
      (data ?? [])
        .map((event) => legendaryEventLifecycleSignature(event, nowMs))
        .join("|"),
    [data]
  )
  // Subscribes for lifecycle flips only; `nowMs` is the clock as of whichever render this is.
  useMinuteNow(signatureAt)
  const nowMs = readMinuteNow()
  return useMemo(() => ({ ...state, nowMs }), [state, nowMs])
}
