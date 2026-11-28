import { useCallback, useMemo } from "react"
import { useTranslation } from "react-i18next"
import type {
  CharacterStorageModel,
  EquipmentStorageModel,
} from "@workspace/game-catalog"

import { itemLibraryPath, useItemName } from "@/shared/equipment"
import { combineReadStates } from "@/shared/lib"
import { toById, useCatalogDataset } from "@/shared/local-data"

import { sortLibraryItems } from "./library-items"

export const LIBRARY_ITEMS_PATH = "/library/items"

export const libraryItemPath = itemLibraryPath

export type LibraryItemsData =
  | { status: "loading" }
  | { status: "error"; retry: () => void }
  | {
      status: "ready"
      /** Every item, by slot, then highest rarity, then name. */
      items: EquipmentStorageModel[]
      charactersById: ReadonlyMap<string, CharacterStorageModel>
      itemName: (item: EquipmentStorageModel) => string
      factionName: (id: string) => string
      factionOf: (characterId: string) => string | undefined
    }

/** The catalog's equipment and characters, for the Library's Items pages (no player data). */
export function useLibraryItems(): LibraryItemsData {
  const { t, i18n } = useTranslation("factions")
  const itemName = useItemName()
  const read = combineReadStates(
    useCatalogDataset("equipment", toById),
    useCatalogDataset("characters", toById)
  )
  const [itemsById, charactersById] =
    read.status === "ready" ? read.data : [undefined, undefined]
  const items = useMemo(
    () =>
      itemsById
        ? sortLibraryItems([...itemsById.values()], itemName, i18n.language)
        : [],
    [itemsById, itemName, i18n.language]
  )
  const factionName = useCallback(
    (id: string) => t(id, { defaultValue: id }),
    [t]
  )
  const factionOf = useCallback(
    (characterId: string) => charactersById?.get(characterId)?.faction,
    [charactersById]
  )

  if (read.status === "loading") return { status: "loading" }
  if (read.status === "error" || !charactersById)
    return { status: "error", retry: read.retry }
  return {
    status: "ready",
    items,
    charactersById,
    itemName,
    factionName,
    factionOf,
  }
}
