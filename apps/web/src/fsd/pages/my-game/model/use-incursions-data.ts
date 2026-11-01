import { useMemo } from "react"

import { combineReadStates } from "@/shared/lib"
import { toById, useCatalogDataset, usePlayerChunk } from "@/shared/local-data"

/**
 * Everything the Incursion page reads from the local catalog and player-data stores, as one read
 * state. `incursions` is an optional dataset (empty until the API serves it); a never-synced `mows`
 * chunk is `undefined` (every MoW then reads as not owned).
 */
export function useIncursionsData() {
  const read = combineReadStates(
    useCatalogDataset("incursions"),
    useCatalogDataset("npcs", toById),
    usePlayerChunk("mows")
  )
  const [incursions, npcsById, mows] = read.status === "ready" ? read.data : []
  const { status, retry } = read

  return useMemo(() => {
    if (status !== "ready") return { status, retry }
    return {
      status,
      retry,
      data: {
        incursions: incursions!,
        npcsById: npcsById!,
        ownedMowIds: new Set((mows ?? []).map((mow) => mow.unitId as string)),
      },
    }
    // `retry` is rebuilt per render by combineReadStates; it only matters on failure.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, incursions, npcsById, mows])
}
