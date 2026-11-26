import { useOutletContext } from "react-router"
import type {
  CharacterStorageModel,
  EquipmentStorageModel,
} from "@workspace/game-catalog"

import type { OwnedItems } from "../../model/items/owned-items"
import type { ItemSuggestions } from "../../model/items/suggestions"

export const ITEMS_PATH = "/my-game/items"

/** The Items tabs, in strip order; each is a route under `ITEMS_PATH`. */
export const ITEMS_TABS = ["pieces", "suggestions", "reclaim"] as const

export type ItemsTab = (typeof ITEMS_TABS)[number]

export function isItemsTab(value: string | undefined): value is ItemsTab {
  return (ITEMS_TABS as readonly (string | undefined)[]).includes(value)
}

/** What the Items page hands its tabs: the synced items, joined once and shared by every tab. */
export type ItemsOutlet = {
  owned: OwnedItems<EquipmentStorageModel>
  suggestions: ItemSuggestions<EquipmentStorageModel>
  itemsById: ReadonlyMap<string, EquipmentStorageModel>
  charactersById: ReadonlyMap<string, CharacterStorageModel>
}

export const useItemsOutlet = () => useOutletContext<ItemsOutlet>()
