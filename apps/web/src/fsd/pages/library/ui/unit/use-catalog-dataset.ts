import { useMemo, useState } from "react"
import { useLiveQuery } from "dexie-react-hooks"
import {
  getGameCatalogMetadata,
  type GameCatalogDatasetKey,
} from "@workspace/game-catalog"

export type CatalogDataset<Record extends { id: string }> = {
  status: "loading" | "failed" | "ready"
  records: Record[]
  byId: Map<string, Record>
  retry: () => void
}

const FAILED = Symbol("failed")

/**
 * Reactive read of one synced catalog dataset with a real failure state, as the NPC page's catalog
 * hook does: `useLiveQuery` would swallow a thrown error into `undefined` forever, and an empty table
 * only means "no records" once the dataset's sync metadata exists.
 */
export function useCatalogDataset<Record extends { id: string }>(
  datasetKey: GameCatalogDatasetKey,
  load: () => Promise<Record[]>
): CatalogDataset<Record> {
  const [retryNonce, setRetryNonce] = useState(0)
  const retry = () => setRetryNonce((value) => value + 1)

  const result = useLiveQuery(async () => {
    try {
      return await load()
    } catch {
      return FAILED
    }
    // `load` is a module-level query function; the dataset key identifies it.
  }, [datasetKey, retryNonce])
  const synced = useLiveQuery(
    async () => {
      try {
        return (await getGameCatalogMetadata()).has(datasetKey)
      } catch {
        return FAILED
      }
    },
    [datasetKey, retryNonce],
    undefined
  )

  return useMemo<CatalogDataset<Record>>(() => {
    if (result === FAILED || synced === FAILED) {
      return { status: "failed", records: [], byId: new Map(), retry }
    }
    if (result === undefined || synced === undefined || !synced) {
      return { status: "loading", records: [], byId: new Map(), retry }
    }
    return {
      status: "ready",
      records: result,
      byId: new Map(result.map((record) => [record.id, record])),
      retry,
    }
  }, [result, synced])
}
