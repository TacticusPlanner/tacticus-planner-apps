import { useMemo } from "react"
import type {
  CharacterStorageModel,
  EquipmentStorageModel,
} from "@workspace/game-catalog"

import { combineReadStates } from "@/shared/lib"
import { toById, useCatalogDataset, usePlayerChunk } from "@/shared/local-data"

import { buildOwnedItems } from "./owned-items"
import type { OwnedItems } from "./owned-items"
import { suggestItems } from "./suggestions"
import type { ItemSuggestions } from "./suggestions"

export type MyItemsData =
  | { status: "loading" }
  | { status: "error"; retry: () => void }
  /** Signed in, but the roster and inventory have never synced. */
  | { status: "not-synced" }
  | {
      status: "ready"
      owned: OwnedItems<EquipmentStorageModel>
      suggestions: ItemSuggestions<EquipmentStorageModel>
      itemsById: ReadonlyMap<string, EquipmentStorageModel>
      charactersById: ReadonlyMap<string, CharacterStorageModel>
    }

/**
 * Everything the Items tabs read: the catalog's equipment and characters, and the synced roster and
 * inventory items, joined into one entry per owned item (`buildOwnedItems`), and what to equip with
 * the spares (`suggestItems`, which Reclaim also reads to keep the copies it hands out).
 */
export function useMyItemsData(): MyItemsData {
  const read = combineReadStates(
    useCatalogDataset("equipment", toById),
    useCatalogDataset("characters", toById),
    usePlayerChunk("characters"),
    usePlayerChunk("inventory-items")
  )
  const ready = read.status === "ready" ? read.data : undefined
  const [itemsById, charactersById, syncedCharacters, inventory] = ready ?? []

  const owned = useMemo(
    () =>
      itemsById && charactersById && syncedCharacters && inventory
        ? buildOwnedItems({
            catalogItems: itemsById,
            catalogCharacters: charactersById,
            syncedCharacters,
            inventory,
          })
        : undefined,
    [itemsById, charactersById, syncedCharacters, inventory]
  )

  const suggestions = useMemo(
    () => (owned && itemsById ? suggestItems(owned, itemsById) : undefined),
    [owned, itemsById]
  )

  if (read.status === "loading") return { status: "loading" }
  if (read.status === "error") return { status: "error", retry: read.retry }
  if (!owned || !suggestions || !itemsById || !charactersById)
    return { status: "not-synced" }
  return { status: "ready", owned, suggestions, itemsById, charactersById }
}
