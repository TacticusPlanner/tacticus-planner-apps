import { useMemo } from "react"
import { useTranslation } from "react-i18next"
import { useLiveQuery } from "dexie-react-hooks"
import { groupByFaction, type UnitId } from "@workspace/game-domain"
import { getCharactersMap, getUpgrades } from "@workspace/game-catalog/queries"

import {
  mapCharacterStorageToDomain,
  mapUpgradeStorageToDomain,
} from "@/features/rank-lookup"

/**
 * The static-catalog reads the goal-creation Sheet needs (character picker + upgrade requirements
 * for the Rank-goal preview), id-keyed for O(1) lookup by the rank-lookup calc functions. This
 * mirrors `pages/lookup/.../hooks/use-character-lookup-catalog.ts` rather than importing it — FSD
 * forbids a page depending on another page, so the (small) catalog-loading logic is duplicated here
 * from the same lower-layer (`features`/`shared`) building blocks instead of reaching across pages.
 * `t` is bound with its own `useTranslation` call for the same reason as that hook: i18next's
 * `TFunction<Ns>` is nominally branded per namespace list.
 */
export function useGoalCatalog() {
  const { t } = useTranslation(["characters", "factions"])

  const charactersById = useLiveQuery(() => getCharactersMap(), [])

  const upgrades = useLiveQuery(() => getUpgrades(), [])
  const upgradesById = useMemo(
    () =>
      new Map(
        (upgrades ?? []).map((u) => [u.id, mapUpgradeStorageToDomain(u)])
      ),
    [upgrades]
  )

  const characterGroups = useMemo(
    () =>
      groupByFaction(
        [...(charactersById?.values() ?? [])].map((c) => ({
          id: c.id,
          name: t(`characters:${c.id}`, { defaultValue: c.name }),
          faction: c.faction,
        })),
        (factionId) => t(`factions:${factionId}`, { defaultValue: factionId })
      ),
    [charactersById, t]
  )

  const getCharacter = (unitId: UnitId) => {
    const record = charactersById?.get(unitId)
    return record ? mapCharacterStorageToDomain(record) : undefined
  }

  /** Display name for a goal row (list/grid). Only Character entities resolve via the catalog today
   * (MoW/upgrade entity types fall back to the raw id — see Phase 3 scope notes). */
  const getEntityName = (entityType: string, entityId: string) => {
    if (entityType !== "Character") {
      return entityId
    }

    const record = charactersById?.get(entityId as UnitId)
    return t(`characters:${entityId}`, {
      defaultValue: record?.name ?? entityId,
    })
  }

  const loading = charactersById === undefined || upgrades === undefined

  return {
    charactersById,
    upgradesById,
    characterGroups,
    getCharacter,
    getEntityName,
    loading,
  }
}
