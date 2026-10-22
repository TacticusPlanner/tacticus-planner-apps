import { useMemo } from "react"
import type { CharacterStorageModel } from "@workspace/game-catalog"

import { useSyncedCatalogDataset } from "../unit/use-catalog-dataset"

export type CharactersCatalog = {
  status: "loading" | "failed" | "ready"
  characters: CharacterStorageModel[]
  byId: Map<string, CharacterStorageModel>
  retry: () => void
}

/** The synced `characters` dataset, with loading and failure states. */
export function useCharactersCatalog(): CharactersCatalog {
  const dataset = useSyncedCatalogDataset("characters")
  return useMemo(
    () => ({
      status: dataset.status,
      characters: dataset.records,
      byId: dataset.byId,
      retry: dataset.retry,
    }),
    [dataset]
  )
}
