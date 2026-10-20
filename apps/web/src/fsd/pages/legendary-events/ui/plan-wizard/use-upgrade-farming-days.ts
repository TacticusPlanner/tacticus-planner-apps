import { useMemo } from "react"
import { useLiveQuery } from "dexie-react-hooks"
import type { UnitId } from "@workspace/game-domain"
import {
  getAscensionCostsMap,
  getCampaignBattles,
  getCampaignDefinitions,
  getCharactersMap,
  getShops,
  getUnlockShardCostsMap,
  getUpgrades,
} from "@workspace/game-catalog/queries"
import {
  getInventoryShards,
  getInventoryUpgrades,
  getPlayerCharacters,
} from "@workspace/player-data/queries"

import { useEligibleCampaignBattles } from "@/features/daily-raids"
import type { FarmingCharacter } from "@/features/goal-farming"
import {
  mapCampaignBattleStorageToDomain,
  mapCharacterStorageToDomain,
  mapUpgradeStorageToDomain,
} from "@/features/rank-lookup"
import { usePlanningSettings } from "@/entities/planning-setting"

import {
  createFarmingDaysEstimator,
  type FarmingDays,
  type UpgradeChainRequest,
} from "./farming-days"

export type UpgradeFarmingDaysState =
  | { status: "loading" }
  | { status: "unavailable" }
  | {
      status: "ready"
      estimate: (request: UpgradeChainRequest) => FarmingDays
    }

/** Wraps a player-data read so an unsynced chunk (`undefined`) reads as `null`, not as loading. */
const settled =
  <T>(read: () => Promise<T | undefined>) =>
  async () =>
    (await read()) ?? null

/**
 * The wizard's farming-days estimator, built once its inputs load: the static catalog (characters,
 * upgrades, the account's eligible campaign nodes, ascension and unlock costs, shops — trimmed
 * from the goals page's `useGoalCatalog`), the synced roster, inventory shards and upgrades, and
 * the planning settings' daily energy. `unavailable` when the catalog holds no characters,
 * upgrades or farmable nodes to estimate against.
 */
export function useUpgradeFarmingDays(): UpgradeFarmingDaysState {
  const charactersById = useLiveQuery(() => getCharactersMap(), [])
  const upgrades = useLiveQuery(() => getUpgrades(), [])
  const campaignBattles = useLiveQuery(() => getCampaignBattles(), [])
  const campaignDefinitions = useLiveQuery(() => getCampaignDefinitions(), [])
  const ascensionCostsById = useLiveQuery(() => getAscensionCostsMap(), [])
  const unlockShardCostsById = useLiveQuery(() => getUnlockShardCostsMap(), [])
  const shops = useLiveQuery(() => getShops(), [])
  const playerCharacters = useLiveQuery(settled(getPlayerCharacters), [])
  const inventoryShards = useLiveQuery(settled(getInventoryShards), [])
  const inventoryUpgrades = useLiveQuery(settled(getInventoryUpgrades), [])
  const { settings, loading: settingsLoading } = usePlanningSettings()
  const { availableBattles } = useEligibleCampaignBattles(
    campaignBattles,
    campaignDefinitions
  )

  const loading =
    charactersById === undefined ||
    upgrades === undefined ||
    campaignBattles === undefined ||
    campaignDefinitions === undefined ||
    ascensionCostsById === undefined ||
    unlockShardCostsById === undefined ||
    shops === undefined ||
    playerCharacters === undefined ||
    inventoryShards === undefined ||
    inventoryUpgrades === undefined ||
    settingsLoading

  // Memoized whole, so `ready` hands out one estimator (and its cache) until an input changes.
  return useMemo((): UpgradeFarmingDaysState => {
    if (loading) return { status: "loading" }
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
}
