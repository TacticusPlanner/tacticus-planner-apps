import { useMemo } from "react"
import { useTranslation } from "react-i18next"
import type { MowStorageModel } from "@workspace/game-catalog"
import { getMows } from "@workspace/game-catalog/queries"

import { orderUnits, type UnitListItem } from "../unit/unit-list.model"
import {
  useCatalogDataset,
  type CatalogDataset,
} from "../unit/use-catalog-dataset"

/** The synced `mows` dataset, with loading and failure states. */
export function useMowsCatalog(): CatalogDataset<MowStorageModel> {
  return useCatalogDataset("mows", getMows)
}

/** Every catalog MoW with its localized name, in the Machines of War list's default order. */
export function useMowListItems(
  mows: readonly MowStorageModel[]
): UnitListItem[] {
  const { t, i18n } = useTranslation(["mows", "factions"])
  return useMemo(
    () =>
      orderUnits(
        mows.map((mow) => ({
          id: mow.id,
          name: t(`mows:${mow.id}`, { defaultValue: mow.name }),
          factionId: mow.faction,
          factionName: t(`factions:${mow.faction}`, {
            defaultValue: mow.faction,
          }),
          alliance: mow.alliance,
        })),
        i18n.language
      ),
    [mows, t, i18n.language]
  )
}
