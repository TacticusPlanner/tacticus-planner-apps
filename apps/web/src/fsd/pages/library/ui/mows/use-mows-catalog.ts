import { useMemo } from "react"
import { useTranslation } from "react-i18next"
import type { MowStorageModel } from "@workspace/game-catalog"

import { useUnitSearchNames } from "@/shared/unit-name"

import { orderUnits, type UnitListItem } from "../unit/unit-list.model"
import {
  useSyncedCatalogDataset,
  type CatalogDataset,
} from "../unit/use-catalog-dataset"

/** The synced `mows` dataset, with loading and failure states. */
export function useMowsCatalog(): CatalogDataset<MowStorageModel> {
  return useSyncedCatalogDataset("mows")
}

/** Every catalog MoW with its localized name, in the Machines of War list's default order. */
export function useMowListItems(
  mows: readonly MowStorageModel[]
): UnitListItem[] {
  const searchNamesOf = useUnitSearchNames()
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
          searchNames: searchNamesOf(mow.id),
        })),
        i18n.language
      ),
    [mows, t, searchNamesOf, i18n.language]
  )
}
