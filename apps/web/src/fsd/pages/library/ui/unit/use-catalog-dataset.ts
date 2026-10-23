import { useMemo } from "react"
import {
  getGameCatalogMetadata,
  type GameCatalogDatasetKey,
  type StorageModel,
} from "@workspace/game-catalog"

import { combineReadStates, useReadState, type ReadState } from "@/shared/lib"
import { toById, useCatalogDataset } from "@/shared/local-data"

export type CatalogDataset<Record extends { id: string }> = {
  status: "loading" | "failed" | "ready"
  records: Record[]
  byId: Map<string, Record>
  retry: () => void
}

/** Whether `datasetKey` has synced at least once: before that its empty table means "not arrived
 *  yet" (the init gate renders pages while the first catalog sync downloads), not "no records". */
export function useDatasetSynced(
  datasetKey: GameCatalogDatasetKey
): ReadState<boolean> {
  return useReadState(
    "catalog-dataset-synced",
    async () => (await getGameCatalogMetadata()).has(datasetKey),
    [datasetKey]
  )
}

/**
 * One synced catalog dataset as a list and by id, with a real failure state. It stays `loading`
 * until the dataset's sync metadata exists, so the Library route does not canonicalize a direct link
 * away while the first sync is still downloading.
 */
export function useSyncedCatalogDataset<K extends GameCatalogDatasetKey>(
  datasetKey: K
): CatalogDataset<StorageModel<K>> {
  const records = useCatalogDataset(datasetKey)
  const byId = useCatalogDataset(datasetKey, toById)
  const synced = useDatasetSynced(datasetKey)
  const read = combineReadStates(records, byId, synced)
  const ready = read.status === "ready" && read.data[2]
  const status =
    read.status === "error" ? "failed" : ready ? "ready" : "loading"
  const recordsData = ready ? read.data[0] : undefined
  const byIdData = ready ? read.data[1] : undefined
  const retry = read.retry

  // Keyed on each read's data (each referentially stable while unchanged), not on the combined tuple.
  return useMemo<CatalogDataset<StorageModel<K>>>(
    () => ({
      status,
      records: recordsData ?? [],
      byId: byIdData ?? new Map<string, StorageModel<K>>(),
      retry,
    }),
    // `retry` is rebuilt per render by combineReadStates; it only matters on failure.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [status, recordsData, byIdData]
  )
}
