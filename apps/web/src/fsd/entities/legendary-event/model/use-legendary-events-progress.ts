import { getLegendaryEventsProgress } from "@workspace/player-data/queries"

import type { LegendaryEventProgress } from "./types"
import { useReadState, type ReadState } from "./use-read-state"

/** The caller's synced progress for every event; a never-synced chunk reads as no entries. */
export function useLegendaryEventsProgress(): ReadState<
  LegendaryEventProgress[]
> {
  return useReadState(
    async () => (await getLegendaryEventsProgress()) ?? [],
    []
  )
}
