import { useMemo } from "react"
import type { UnitId } from "@workspace/game-domain"

import { useEligibleCampaignBattles } from "@/features/daily-raids"
import type { FarmingCharacter } from "@/features/goal-farming"
import {
  mapCampaignBattleStorageToDomain,
  mapCharacterStorageToDomain,
  mapUpgradeStorageToDomain,
} from "@/features/rank-lookup"
import { usePlanningSettings } from "@/entities/planning-setting"
import { combineReadStates } from "@/shared/lib"
import { toById, useCatalogDataset, usePlayerChunk } from "@/shared/local-data"

import {
  createFarmingDaysEstimator,
  type FarmingDays,
  type UpgradeChainRequest,
} from "./farming-days"

export type UpgradeFarmingDaysState =
  | { status: "loading" }
  | { status: "unavailable" }
  /** A local read failed; the wizard presents it like `unavailable`. */
  | { status: "error"; retry: () => void }
  | {
      status: "ready"
      estimate: (request: UpgradeChainRequest) => FarmingDays
    }

/**
 * The wizard's farming-days estimator, built once its inputs load: the static catalog (characters,
 * upgrades, the account's eligible campaign nodes, ascension and unlock costs, shops — trimmed
 * from the goals page's `useGoalCatalog`), the synced roster, inventory shards and upgrades, and
 * the planning settings' daily energy. `unavailable` when the catalog holds no characters,
 * upgrades or farmable nodes to estimate against.
 */
export function useUpgradeFarmingDays(): UpgradeFarmingDaysState {
  const charactersRead = useCatalogDataset("characters", toById)
  const upgradesRead = useCatalogDataset("upgrades")
  const campaignBattlesRead = useCatalogDataset("campaign-battles")
  const campaignDefinitionsRead = useCatalogDataset("campaign-definitions")
  const ascensionCostsRead = useCatalogDataset("ascension-costs", toById)
  const unlockShardCostsRead = useCatalogDataset("unlock-shard-costs", toById)
  const shopsRead = useCatalogDataset("shops")
  const playerCharactersRead = usePlayerChunk("characters")
  const inventoryShardsRead = usePlayerChunk("inventory-shards")
  const inventoryUpgradesRead = usePlayerChunk("inventory-upgrades")
  const { settings, loading: settingsLoading } = usePlanningSettings()
  const campaignBattles =
    campaignBattlesRead.status === "ready"
      ? campaignBattlesRead.data
      : undefined
  const campaignDefinitions =
    campaignDefinitionsRead.status === "ready"
      ? campaignDefinitionsRead.data
      : undefined
  const { availableBattles } = useEligibleCampaignBattles(
    campaignBattles,
    campaignDefinitions
  )

  const read = combineReadStates(
    charactersRead,
    upgradesRead,
    campaignBattlesRead,
    campaignDefinitionsRead,
    ascensionCostsRead,
    unlockShardCostsRead,
    shopsRead,
    playerCharactersRead,
    inventoryShardsRead,
    inventoryUpgradesRead
  )
  // The tuple is new every render, so the memo below keys on each read's own data instead.
  const data = read.status === "ready" ? read.data : undefined
  const [
    charactersById,
    upgrades,
    ,
    ,
    ascensionCostsById,
    unlockShardCostsById,
    shops,
    playerCharacters,
    inventoryShards,
    inventoryUpgrades,
  ] = data ?? []
  const loading = read.status === "loading" || settingsLoading

  // Memoized whole, so `ready` hands out one estimator (and its cache) until an input changes.
  const state = useMemo((): UpgradeFarmingDaysState => {
    if (
      loading ||
      !charactersById ||
      !upgrades ||
      !ascensionCostsById ||
      !unlockShardCostsById ||
      !shops
    ) {
      return { status: "loading" }
    }
    if (
      charactersById.size === 0 ||
      upgrades.length === 0 ||
      availableBattles.length === 0
    ) {
      return { status: "unavailable" }
    }
    const characterCache = new Map<string, FarmingCharacter | undefined>()
    const getCharacter = (unitId: UnitId) => {
      if (!characterCache.has(unitId)) {
        const record = charactersById.get(unitId)
        characterCache.set(
          unitId,
          record ? mapCharacterStorageToDomain(record) : undefined
        )
      }
      return characterCache.get(unitId)
    }
    const estimate = createFarmingDaysEstimator({
      charactersById,
      getCharacter,
      upgradesById: new Map(
        upgrades.map((upgrade) => [
          upgrade.id,
          mapUpgradeStorageToDomain(upgrade),
        ])
      ),
      battlesById: new Map(
        availableBattles.map((battle) => [
          battle.id,
          mapCampaignBattleStorageToDomain(battle),
        ])
      ),
      ascensionCostsById,
      unlockShardCostsById,
      shops,
      playerCharacterById: new Map(
        (playerCharacters ?? []).map((unit) => [unit.unitId, unit])
      ),
      inventoryShardById: new Map(
        (inventoryShards ?? []).map((shard) => [shard.unitId, shard])
      ),
      inventoryUpgrades: inventoryUpgrades ?? [],
      dailyEnergy: settings.dailyEnergy,
    })
    return { status: "ready", estimate }
  }, [
    loading,
    charactersById,
    upgrades,
    availableBattles,
    ascensionCostsById,
    unlockShardCostsById,
    shops,
    playerCharacters,
    inventoryShards,
    inventoryUpgrades,
    settings.dailyEnergy,
  ])
  return read.status === "error"
    ? { status: "error", retry: read.retry }
    : state
}
