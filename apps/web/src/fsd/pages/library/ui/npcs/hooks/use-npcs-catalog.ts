import { useMemo } from "react"

import { buildNpcGroups, type NpcGroup } from "@/entities/npc"
import { combineReadStates } from "@/shared/lib"
import { useCatalogDataset } from "@/shared/local-data"

import { useDatasetSynced } from "../../unit/use-catalog-dataset"

type NpcsCatalogStatus = "loading" | "failed" | "ready"

export type NpcsCatalog = {
  status: NpcsCatalogStatus
  /** Listed NPC groups (units only, usable ladders only), in served order. */
  groups: NpcGroup[]
  byId: Map<string, NpcGroup>
  /** Re-runs the dataset read; meaningful only in the `failed` state. */
  retry: () => void
}

/**
 * The synced `npcs` dataset, grouped into listed NPCs, with a retry-able failure state.
 *
 * The init gate renders pages while the very first catalog sync is still downloading, during which the
 * dataset table is simply empty. An empty table is only "no records" once the dataset's sync metadata
 * exists; before that the page stays in `loading` so the Library route does not canonicalize a direct
 * link away to the collection URL.
 */
export function useNpcsCatalog(): NpcsCatalog {
  const read = combineReadStates(
    useCatalogDataset("npcs"),
    useDatasetSynced("npcs")
  )
  const npcs =
    read.status === "ready" && read.data[1] ? read.data[0] : undefined
  const failed = read.status === "error"
  const retry = read.retry

  // Keyed on the dataset (referentially stable while unchanged), not on the combined tuple.
  return useMemo<NpcsCatalog>(() => {
    if (failed) {
      return { status: "failed", groups: [], byId: new Map(), retry }
    }
    if (!npcs) {
      return { status: "loading", groups: [], byId: new Map(), retry }
    }
    // `buildNpcGroups` throws on a slug collision, which a future catalog could introduce without any
    // code change here. Surfacing that as the page's failure state beats taking the route down with it.
    let groups: NpcGroup[]
    try {
      groups = buildNpcGroups(npcs)
    } catch {
      return { status: "failed", groups: [], byId: new Map(), retry }
    }
    return {
      status: "ready",
      groups,
      byId: new Map(groups.map((group) => [group.id, group])),
      retry,
    }
    // `retry` is rebuilt per render by combineReadStates; it only matters on failure.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [failed, npcs])
}
