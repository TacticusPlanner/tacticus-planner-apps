import { getLegendaryEventProgress } from "@workspace/player-data/queries"

import type { LegendaryEventProgress } from "./types"
import { useReadState, type ReadState } from "./use-read-state"

/** The caller's synced progress for one event; `data` is `undefined` when the chunk has no entry. */
export function useLegendaryEventProgress(
  eventId: string
): ReadState<LegendaryEventProgress | undefined> {
  return useReadState(() => getLegendaryEventProgress(eventId), [eventId])
}
