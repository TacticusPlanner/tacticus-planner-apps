import { useMemo, useState } from "react"
import { useLiveQuery } from "dexie-react-hooks"
import { getGameCatalogMetadata } from "@workspace/game-catalog"
import { getNpcs } from "@workspace/game-catalog/queries"

import { buildNpcGroups, type NpcGroup } from "@/entities/npc"

type NpcsCatalogStatus = "loading" | "failed" | "ready"

export type NpcsCatalog = {
  status: NpcsCatalogStatus
  /** Listed NPC groups (units only, usable ladders only), in served order. */
  groups: NpcGroup[]
  byId: Map<string, NpcGroup>
  /** Re-runs the dataset read; meaningful only in the `failed` state. */
  retry: () => void
}

const FAILED = Symbol("failed")
const NPCS_DATASET_KEY = "npcs"

/**
 * Reactive read of the synced `npcs` dataset, grouped into listed NPCs. Mirrors the raid-bosses hook:
 * `useLiveQuery` swallows a thrown error into `undefined` forever, so the read is wrapped to expose a
 * real, retry-able failure state.
 *
 * The init gate renders pages while the very first catalog sync is still downloading, during which the
 * dataset table is simply empty. An empty table is only "no records" once the dataset's sync metadata
 * exists; before that the page stays in `loading` so the Library route does not canonicalize a direct
 * link away to the collection URL.
 */
export function useNpcsCatalog(): NpcsCatalog {
  const [retryNonce, setRetryNonce] = useState(0)
  const retry = () => setRetryNonce((value) => value + 1)

  const result = useLiveQuery(async () => {
    try {
      return await getNpcs()
    } catch {
      return FAILED
    }
  }, [retryNonce])
  const synced = useLiveQuery(
    async () => {
      try {
        return (await getGameCatalogMetadata()).has(NPCS_DATASET_KEY)
      } catch {
        return FAILED
      }
    },
    [retryNonce],
    undefined
  )

  return useMemo<NpcsCatalog>(() => {
    if (result === FAILED || synced === FAILED) {
      return { status: "failed", groups: [], byId: new Map(), retry }
    }
    if (result === undefined || synced === undefined || !synced) {
      return { status: "loading", groups: [], byId: new Map(), retry }
    }
    // `buildNpcGroups` throws on a slug collision, which a future catalog could introduce without any
    // code change here. Surfacing that as the page's failure state beats taking the route down with it.
    let groups: NpcGroup[]
    try {
      groups = buildNpcGroups(result)
    } catch {
      return { status: "failed", groups: [], byId: new Map(), retry }
    }
    return {
      status: "ready",
      groups,
      byId: new Map(groups.map((group) => [group.id, group])),
      retry,
    }
  }, [result, synced])
}
