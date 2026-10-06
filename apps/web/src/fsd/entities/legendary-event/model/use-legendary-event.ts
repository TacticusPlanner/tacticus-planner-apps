import {
  getLegendaryEvent,
  hasLegendaryEventsSynced,
} from "@workspace/game-catalog/queries"

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
  const state = useReadState(async () => {
    const [event, catalogSynced] = await Promise.all([
      getLegendaryEvent(eventId),
      hasLegendaryEventsSynced(),
    ])
    return { event, catalogSynced }
  }, [eventId])

  if (state.status !== "ready") {
    return { ...state, nowMs, lifecycle: undefined, catalogSynced: false }
  }
  const { event, catalogSynced } = state.data
  return {
    status: "ready",
    data: event,
    retry: state.retry,
    nowMs,
    lifecycle: event ? deriveLegendaryEventLifecycle(event, nowMs) : undefined,
    catalogSynced,
  }
}
