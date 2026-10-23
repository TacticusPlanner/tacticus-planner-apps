import { useMemo } from "react"

import { combineReadStates } from "@/shared/lib"
import { useCatalogDataset, usePlayerChunk } from "@/shared/local-data"

/**
 * Everything the Campaign Events page needs from the local catalog and player-data stores, as one
 * read state: a failed read is `error` (the page's own load-error state). A never-synced player
 * chunk is `undefined`, not a failure — it means the profile has never synced.
 */
export function useCampaignEventsData() {
  const read = combineReadStates(
    useCatalogDataset("campaign-definitions"),
    useCatalogDataset("campaign-battles"),
    usePlayerChunk("campaign-events-progress"),
    usePlayerChunk("characters"),
    usePlayerChunk("live-progress")
  )
  const [definitions, battles, synced, characters, liveProgress] =
    read.status === "ready" ? read.data : []
  const { status, retry } = read

  // Keyed on each read's data (each referentially stable while unchanged), not on the combined tuple.
  return useMemo(() => {
    if (status !== "ready") return { status, retry }
    return {
      status,
      retry,
      data: {
        definitions: definitions!,
        battles: battles!,
        synced: synced ?? undefined,
        characters: characters ?? undefined,
        liveProgress: liveProgress ?? undefined,
      },
    }
    // `retry` is rebuilt per render by combineReadStates; it only matters on failure.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, definitions, battles, synced, characters, liveProgress])
}
