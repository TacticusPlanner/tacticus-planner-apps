import { useCallback } from "react"

import { usePlayerChunk } from "@/shared/local-data"

import type { LegendaryEventProgress } from "./types"
import type { ReadState } from "./use-read-state"

/** The caller's synced progress for one event; `data` is `undefined` when the chunk has no entry. */
export function useLegendaryEventProgress(
  eventId: string
): ReadState<LegendaryEventProgress | undefined> {
  const select = useCallback(
    (chunk: LegendaryEventProgress[] | null) =>
      chunk?.find((entry) => entry.id === eventId),
    [eventId]
  )
  return usePlayerChunk("lre-progress", select)
}
