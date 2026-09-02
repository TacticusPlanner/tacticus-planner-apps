import { useMemo } from "react"
import { useTranslation } from "react-i18next"
import { useLiveQuery } from "dexie-react-hooks"
import {
  factionRank,
  groupByFaction,
  type FactionGroup,
  type UnitId,
} from "@workspace/game-domain"
import type { CampaignDefinitionStorageModel } from "@workspace/game-catalog"
import {
  getAscensionCostsMap,
  getCampaignBattles,
  getCampaignDefinitions,
  getCharactersMap,
  getMowsMap,
  getUnlockShardCostsMap,
  getUpgrades,
} from "@workspace/game-catalog/queries"

import {
  mapCampaignBattleStorageToDomain,
  mapCharacterStorageToDomain,
  mapUpgradeStorageToDomain,
} from "@/features/rank-lookup"

/**
 * The static-catalog reads the goal-creation Sheet needs (character picker + upgrade requirements
 * for the Rank-goal preview), id-keyed for O(1) lookup by the rank-lookup calc functions. This
 * mirrors `pages/library/.../hooks/use-character-lookup-catalog.ts` rather than importing it вЂ” FSD
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

  // Battle economics (energy cost) for the estimation engine (plan В§16 phase 4) вЂ” mirrors
  // `pages/library/.../use-character-lookup-catalog.ts`'s `battlesById`, duplicated for the same
  // page-can't-import-page reason as the rest of this hook.
  const campaignBattles = useLiveQuery(() => getCampaignBattles(), [])
  const battlesById = useMemo(
    () =>
      new Map(
        (campaignBattles ?? []).map((b) => [
          b.id,
          mapCampaignBattleStorageToDomain(b),
        ])
      ),
    [campaignBattles]
  )

  // Event-vs-standing-campaign detection for the Insights view's campaign/event scoring (plan В§16
  // phase 7) вЂ” mirrors `pages/library/.../use-character-lookup-catalog.ts`'s `releaseTypeByGroupId`,
  // duplicated for the same page-can't-import-page reason as the rest of this hook.
  const campaignDefinitions = useLiveQuery(() => getCampaignDefinitions(), [])
  const releaseTypeByGroupId = useMemo(
    () =>
      new Map(
        (campaignDefinitions ?? []).map((d: CampaignDefinitionStorageModel) => [
          d.groupId,
          d.releaseType,
        ])
      ),
    [campaignDefinitions]
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

  // Machines of War (plan В§16 phase 6) вЂ” no `mows` i18n namespace exists (MoW catalog records already
  // carry a plain display `name`, unlike character ids which key into translated strings), so this
  // groups on the raw catalog name directly rather than going through `t()`.
  const mowsById = useLiveQuery(() => getMowsMap(), [])
  const mowGroups = useMemo(
    () =>
      groupByFaction(
        [...(mowsById?.values() ?? [])].map((mow) => ({
          id: mow.id,
          name: mow.name,
          faction: mow.faction,
        })),
        (factionId) => t(`factions:${factionId}`, { defaultValue: factionId })
      ),
    [mowsById, t]
  )

  // Combined "Unit" picker (plan: merge the Character/Mow tabs into one) вЂ” same faction, same
  // group, Characters and Mows interleaved together rather than shown as separate faction lists.
  const unitGroups = useMemo(
    () => mergeUnitGroups(characterGroups, mowGroups),
    [characterGroups, mowGroups]
  )

  const getCharacter = (unitId: UnitId) => {
    const record = charactersById?.get(unitId)
    return record ? mapCharacterStorageToDomain(record) : undefined
  }

  const getMow = (unitId: UnitId) => mowsById?.get(unitId)

  // The shared ascension-orb/shard cost ladder + per-rarity unlock-shard table (plan В§16 phase 7) вЂ”
  // both single catalog-wide tables, not per-character, so no grouping/id-lookup helper beyond the
  // map itself is needed.
  const ascensionCostsById = useLiveQuery(() => getAscensionCostsMap(), [])
  const unlockShardCostsById = useLiveQuery(() => getUnlockShardCostsMap(), [])

  /** Display name for a goal row (list/grid). Character and Mow entities resolve via the catalog
   * (upgrade entity types fall back to the raw id вЂ” see Phase 3 scope notes). */
  const getEntityName = (entityType: string, entityId: string) => {
    if (entityType === "Mow") {
      return mowsById?.get(entityId)?.name ?? entityId
    }
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
    mowsById,
    upgradesById,
    battlesById,
    ascensionCostsById,
    unlockShardCostsById,
    releaseTypeByGroupId,
    characterGroups,
    mowGroups,
    unitGroups,
    getCharacter,
    getMow,
    getEntityName,
    loading,
  }
}

/** Combines two already-faction-grouped lists into one, merging same-faction groups (rather than
 * appending a second same-named faction heading) and re-sorting by the shared faction order. */
function mergeUnitGroups(a: FactionGroup[], b: FactionGroup[]): FactionGroup[] {
  const byFaction = new Map<string, FactionGroup>()
  for (const group of [...a, ...b]) {
    const existing = byFaction.get(group.factionId)
    if (existing) {
      existing.members.push(...group.members)
    } else {
      byFaction.set(group.factionId, { ...group, members: [...group.members] })
    }
  }
  return [...byFaction.values()].sort(
    (x, y) => factionRank(x.factionId) - factionRank(y.factionId)
  )
}
