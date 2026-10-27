import { useMemo } from "react"
import { useTranslation } from "react-i18next"
import { allianceRank, type Alliance } from "@workspace/game-domain"

import { useCatalogDataset } from "@/shared/local-data"

export interface CollectionFactionOption {
  id: string
  name: string
  alliance: Alliance
}

/**
 * Every faction a catalog unit belongs to, in Collection's group order (alliance, then localized
 * name): the Faction filter's options and the ids its URL value is validated against. `undefined`
 * until both unit datasets are read. The reads share the Collection view's cached queries.
 */
export function useCollectionFactions(): CollectionFactionOption[] | undefined {
  const { t, i18n } = useTranslation("factions")
  const charactersRead = useCatalogDataset("characters")
  const mowsRead = useCatalogDataset("mows")
  const characters =
    charactersRead.status === "ready" ? charactersRead.data : undefined
  const mows = mowsRead.status === "ready" ? mowsRead.data : undefined

  return useMemo(
    () =>
      characters && mows
        ? factionOptions([...characters, ...mows], (id) =>
            t(id, { defaultValue: id })
          ).sort(
            (a, b) =>
              allianceRank(a.alliance) - allianceRank(b.alliance) ||
              a.name.localeCompare(b.name, i18n.language)
          )
        : undefined,
    [characters, mows, t, i18n.language]
  )
}

function factionOptions(
  units: readonly { faction: string; alliance: Alliance }[],
  factionName: (id: string) => string
): CollectionFactionOption[] {
  const byId = new Map<string, CollectionFactionOption>()
  for (const unit of units) {
    if (!byId.has(unit.faction)) {
      byId.set(unit.faction, {
        id: unit.faction,
        name: factionName(unit.faction),
        alliance: unit.alliance,
      })
    }
  }
  return [...byId.values()]
}
