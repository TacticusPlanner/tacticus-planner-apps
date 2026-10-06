import { getLegendaryEvent } from "@workspace/game-catalog/queries"

import { deriveLegendaryEventLifecycle } from "../lib/lifecycle"
import type { LegendaryEvent, LegendaryEventLifecycle } from "./types"
import { useMinuteNow } from "./use-minute-now"
import { useReadState, type ReadState } from "./use-read-state"

export type LegendaryEventState = ReadState<LegendaryEvent | undefined> & {
  nowMs: number
  /** The event's lifecycle at `nowMs`, once the event is known. */
  lifecycle: LegendaryEventLifecycle | undefined
}

/** One catalog Legendary Event by id (`data` is `undefined` for an unknown id), with its
 *  lifecycle re-evaluated once a minute. */
export function useLegendaryEvent(eventId: string): LegendaryEventState {
  const nowMs = useMinuteNow()
  const state = useReadState(() => getLegendaryEvent(eventId), [eventId])
  const lifecycle =
    state.status === "ready" && state.data
      ? deriveLegendaryEventLifecycle(state.data, nowMs)
      : undefined
  return { ...state, nowMs, lifecycle }
}
