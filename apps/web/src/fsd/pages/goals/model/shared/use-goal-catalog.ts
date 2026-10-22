import { useMemo } from "react"
import { useTranslation } from "react-i18next"
import {
  factionRank,
  groupByFaction,
  type FactionGroup,
  type UnitId,
} from "@workspace/game-domain"
import type {
  CampaignDefinitionStorageModel,
  UpgradeStorageModel,
} from "@workspace/game-catalog"

import { useEligibleCampaignBattles } from "@/features/daily-raids"
import {
  mapCampaignBattleStorageToDomain,
  mapCharacterStorageToDomain,
  mapUpgradeStorageToDomain,
} from "@/features/rank-lookup"
import { toById, useCatalogDataset } from "@/shared/local-data"
import { useUnitName } from "@/shared/unit-name"

import { readyData } from "./read-data"

/**
 * The static-catalog reads the goal-creation Sheet needs (character picker + upgrade requirements
 * for the Rank-goal preview), id-keyed for O(1) lookup by the rank-lookup calc functions. This
 * mirrors `pages/library/.../hooks/use-character-lookup-catalog.ts` rather than importing it — FSD
 * forbids a page depending on another page, so the (small) catalog-loading logic is duplicated here
 * from the same lower-layer (`features`/`shared`) building blocks instead of reaching across pages.
 * `t` is bound with its own `useTranslation` call for the same reason as that hook: i18next's
 * `TFunction<Ns>` is nominally branded per namespace list.
 *
 * Mounted once per goal row, so every dataset comes from the shared read cache (one IndexedDB read
 * per dataset, whatever the row count) and every map is a module-level selector.
 */
export function useGoalCatalog() {
  const { t } = useTranslation(["characters", "factions"])

  const charactersById = readyData(useCatalogDataset("characters", toById))

  const upgradesRead = useCatalogDataset("upgrades", toUpgradesById)
  const upgradesById = readyData(upgradesRead) ?? emptyUpgradesById

  // Battle economics (energy cost) for the estimation engine (plan §16 phase 4) — mirrors
  // `pages/library/.../use-character-lookup-catalog.ts`'s `battlesById`, duplicated for the same
  // page-can't-import-page reason as the rest of this hook.
  const campaignBattles = readyData(useCatalogDataset("campaign-battles"))
  const campaignDefinitions = readyData(
    useCatalogDataset("campaign-definitions")
  )
  const releaseTypeByGroupId =
    readyData(
      useCatalogDataset("campaign-definitions", toReleaseTypeByGroupId)
    ) ?? emptyReleaseTypeByGroupId
  // Only eligible nodes are farmable: the same rule Today and Raids Plan use (standing nodes
  // reached; event nodes only for the active event and once reached), applied through the
  // daily-raids public API so every estimate consumer (Goals, Insights, blockers, per-project)
  // chooses from the same set. Not-yet-loaded event inputs mean no event node is eligible.
  const { availableBattles } = useEligibleCampaignBattles(
    campaignBattles,
    campaignDefinitions
  )
  const battlesById = useMemo(
    () =>
      new Map(
        availableBattles.map((b) => [b.id, mapCampaignBattleStorageToDomain(b)])
      ),
    [availableBattles]
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

  // Machines of War (plan §16 phase 6) — no `mows` i18n namespace exists (MoW catalog records already
  // carry a plain display `name`, unlike character ids which key into translated strings), so this
  // groups on the raw catalog name directly rather than going through `t()`.
  const mowsById = readyData(useCatalogDataset("mows", toById))
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

  // Combined "Unit" picker (plan: merge the Character/Mow tabs into one) — same faction, same
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

  // The shared ascension-orb/shard cost ladder + per-rarity unlock-shard table (plan §16 phase 7) —
  // both single catalog-wide tables, not per-character, so no grouping/id-lookup helper beyond the
  // map itself is needed.
  const ascensionCostsById = readyData(
    useCatalogDataset("ascension-costs", toById)
  )
  const unlockShardCostsById = readyData(
    useCatalogDataset("unlock-shard-costs", toById)
  )

  // Per-level ability cost ladders, keyed by the level a rung raises an ability to. `undefined` until
  // loaded; a missing/empty dataset just means no ability materials (see `abilityMaterialsNeed`).
  const mowUpgradeCostsByLevel = readyData(
    useCatalogDataset("mow-upgrade-costs", byLevel)
  )
  const characterAbilityCostsByLevel = readyData(
    useCatalogDataset("character-ability-costs", byLevel)
  )

  /** Display name for a goal row (list/grid) — the shared resolver, so the Goals pages, the V1
   * import report, and `features/project-management`'s assembly sheet all name units identically. */
  const getEntityName = useUnitName()

  const loading =
    charactersById === undefined || upgradesRead.status !== "ready"

  return {
    charactersById,
    mowsById,
    upgradesById,
    battlesById,
    ascensionCostsById,
    unlockShardCostsById,
    mowUpgradeCostsByLevel,
    characterAbilityCostsByLevel,
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

const toUpgradesById = (upgrades: UpgradeStorageModel[]) =>
  new Map(upgrades.map((u) => [u.id, mapUpgradeStorageToDomain(u)]))
const emptyUpgradesById: ReturnType<typeof toUpgradesById> = new Map()

const toReleaseTypeByGroupId = (
  definitions: CampaignDefinitionStorageModel[]
) => new Map(definitions.map((d) => [d.groupId, d.releaseType]))
const emptyReleaseTypeByGroupId: ReturnType<typeof toReleaseTypeByGroupId> =
  new Map()

const byLevel = <T extends { level: number }>(rows: readonly T[]) =>
  new Map(rows.map((row) => [row.level, row]))

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
