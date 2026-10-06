import { getLegendaryEvents } from "@workspace/game-catalog/queries"

import type { LegendaryEvent } from "./types"
import { useMinuteNow } from "./use-minute-now"
import { useReadState, type ReadState } from "./use-read-state"

export type LegendaryEventsState = ReadState<LegendaryEvent[]> & {
  /** The instant lifecycle is evaluated at, refreshed once a minute. */
  nowMs: number
}

/** Every catalog Legendary Event, with a minute tick for lifecycle. */
export function useLegendaryEvents(): LegendaryEventsState {
  const nowMs = useMinuteNow()
  const state = useReadState(() => getLegendaryEvents(), [])
  return { ...state, nowMs }
}
