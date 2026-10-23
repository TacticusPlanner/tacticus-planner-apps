import { usePlayerChunk } from "@/shared/local-data"

import type { LegendaryEventProgress } from "./types"
import type { ReadState } from "./use-read-state"

function orEmpty(
  chunk: LegendaryEventProgress[] | null
): LegendaryEventProgress[] {
  return chunk ?? []
}

/** The caller's synced progress for every event; a never-synced chunk reads as no entries. */
export function useLegendaryEventsProgress(): ReadState<
  LegendaryEventProgress[]
> {
  return usePlayerChunk("lre-progress", orEmpty)
}
