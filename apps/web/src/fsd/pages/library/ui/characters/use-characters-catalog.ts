import { useMemo, useState } from "react"
import { useLiveQuery } from "dexie-react-hooks"
import {
  getGameCatalogMetadata,
  type CharacterStorageModel,
} from "@workspace/game-catalog"
import { getCharacters } from "@workspace/game-catalog/queries"

type Status = "loading" | "failed" | "ready"

export type CharactersCatalog = {
  status: Status
  characters: CharacterStorageModel[]
  byId: Map<string, CharacterStorageModel>
  retry: () => void
}

const FAILED = Symbol("failed")
const DATASET_KEY = "characters"

/**
 * Reactive read of the synced `characters` dataset with a real failure state, as the NPC page's
 * catalog hook does: `useLiveQuery` would swallow a thrown error into `undefined` forever, and an
 * empty table only means "no characters" once the dataset's sync metadata exists.
 */
export function useCharactersCatalog(): CharactersCatalog {
  const [retryNonce, setRetryNonce] = useState(0)
  const retry = () => setRetryNonce((value) => value + 1)

  const result = useLiveQuery(async () => {
    try {
      return await getCharacters()
    } catch {
      return FAILED
    }
  }, [retryNonce])
  const synced = useLiveQuery(
    async () => {
      try {
        return (await getGameCatalogMetadata()).has(DATASET_KEY)
      } catch {
        return FAILED
      }
    },
    [retryNonce],
    undefined
  )

  return useMemo<CharactersCatalog>(() => {
    if (result === FAILED || synced === FAILED) {
      return { status: "failed", characters: [], byId: new Map(), retry }
    }
    if (result === undefined || synced === undefined || !synced) {
      return { status: "loading", characters: [], byId: new Map(), retry }
    }
    return {
      status: "ready",
      characters: result,
      byId: new Map(result.map((character) => [character.id, character])),
      retry,
    }
  }, [result, synced])
}
