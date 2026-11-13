import { useMemo } from "react"
import { useTranslation } from "react-i18next"
import {
  computeShopLockContext,
  type CharacterStorageModel,
  type EquipmentStorageModel,
  type MowStorageModel,
  type RosterUnit,
  type ShopLockContext,
  type UpgradeStorageModel,
} from "@workspace/game-catalog"
import { progressionStarsIndex } from "@workspace/game-domain"

import { useGlobalGoalPlan, type GoalDetail } from "@/entities/goal"
import {
  mapCharacterStorageToDomain,
  mapUpgradeStorageToDomain,
} from "@/features/rank-lookup/@x/shops/recommendations"

import { activeProjectMembers } from "@/features/daily-raids/@x/shops/recommendations"
import { combineReadStates } from "@/shared/lib"
import { toById, useCatalogDataset, usePlayerChunk } from "@/shared/local-data"
import { aggregateShopNeeds, type ShopNeedAggregate } from "./shop-needs"

const toUpgradesById = (records: UpgradeStorageModel[]) =>
  new Map(records.map((item) => [item.id, mapUpgradeStorageToDomain(item)]))

// undefined until the inventory has synced once, which keeps the needs loading.
const toAmountById = (
  inventory: readonly { upgradeId: string; amount: number }[] | null
) =>
  inventory
    ? new Map(inventory.map((entry) => [entry.upgradeId, entry.amount]))
    : undefined

const toList = <T>(chunk: readonly T[] | null): readonly T[] => chunk ?? []

function toByUnitId<T extends { unitId: string }>(
  chunk: readonly T[] | null
): ReadonlyMap<string, T> {
  return new Map((chunk ?? []).map((record) => [record.unitId, record]))
}

interface ShopNeedsReady {
  status: "ready"
  needs: ShopNeedAggregate
  /** Active goals in scope; 0 means "no goals" for the consumer. */
  activeGoalCount: number
  /** The roster's shop lock context (tier, unit stars) and power level, as shops resolve them. */
  lockContext: ShopLockContext
  powerLevel: number
  upgradesById: ReturnType<typeof toUpgradesById>
  charactersById: ReadonlyMap<string, CharacterStorageModel>
  mowsById: ReadonlyMap<string, MowStorageModel>
  equipmentById: ReadonlyMap<string, EquipmentStorageModel>
  retry: () => void
}

export type ShopNeedsState =
  | { status: "loading" }
  | { status: "error"; retry: () => void }
  | ShopNeedsReady

/**
 * The outstanding shop-available needs (character shards, mythic shards, uncraftable Mythic upgrade
 * materials) of the Active goals in scope — every Active goal in the account's global order, or one
 * project's (`projectId`) — with the roster's shop lock context. Shared by the Today shop
 * recommendations and the event shop's coverage.
 */
export function useShopNeeds(projectId: string | undefined): ShopNeedsState {
  const { t } = useTranslation(["characters"])

  // The goals list carries every goal in full and its `projectIds`, so a project scope is a filter of
  // the global plan — no membership or per-goal read.
  const globalPlan = useGlobalGoalPlan()
  const members =
    globalPlan.loading || globalPlan.isError
      ? undefined
      : projectId
        ? globalPlan.entries.filter((entry) =>
            entry.goal.projectIds.includes(projectId)
          )
        : globalPlan.entries
  const activeMembers = activeProjectMembers(members ?? [])
  const details = activeMembers.map((member) => member.goal)

  // Catalog and player data from the shared read cache; whole chunks by unit id, so a goal change
  // reads nothing.
  const charactersRead = useCatalogDataset("characters", toById)
  const mowsRead = useCatalogDataset("mows", toById)
  const equipmentRead = useCatalogDataset("equipment", toById)
  const upgradesRead = useCatalogDataset("upgrades", toUpgradesById)
  const ascensionCostsRead = useCatalogDataset("ascension-costs", toById)
  const unlockShardCostsRead = useCatalogDataset("unlock-shard-costs", toById)
  const inventoryRead = usePlayerChunk("inventory-upgrades", toAmountById)
  const playerDetailsRead = usePlayerChunk("player-details")
  const rosterCharactersRead = usePlayerChunk("characters", toList)
  const rosterMowsRead = usePlayerChunk("mows", toList)
  const playerCharactersRead = usePlayerChunk("characters", toByUnitId)
  const playerMowsRead = usePlayerChunk("mows", toByUnitId)
  const inventoryShardsRead = usePlayerChunk("inventory-shards", toByUnitId)
  // Each read is stable while unchanged, so the combination (and its data tuple) is too.
  const read = useMemo(
    () =>
      combineReadStates(
        charactersRead,
        mowsRead,
        equipmentRead,
        upgradesRead,
        ascensionCostsRead,
        unlockShardCostsRead,
        inventoryRead,
        playerDetailsRead,
        rosterCharactersRead,
        rosterMowsRead,
        playerCharactersRead,
        playerMowsRead,
        inventoryShardsRead
      ),
    [
      charactersRead,
      mowsRead,
      equipmentRead,
      upgradesRead,
      ascensionCostsRead,
      unlockShardCostsRead,
      inventoryRead,
      playerDetailsRead,
      rosterCharactersRead,
      rosterMowsRead,
      playerCharactersRead,
      playerMowsRead,
      inventoryShardsRead,
    ]
  )
  const data = read.status === "ready" ? read.data : undefined

  const computed = useMemo(() => {
    if (!members || !data) return null
    const [
      charactersById,
      mowsById,
      equipmentById,
      upgradesById,
      ascensionCostsById,
      unlockShardCostsById,
      inventoryUpgradeAmountById,
      playerDetails,
      rosterCharacters,
      rosterMows,
      playerCharacterById,
      playerMowById,
      inventoryShardById,
    ] = data
    if (!inventoryUpgradeAmountById) return null

    const getUnitLabel = (detail: GoalDetail) => {
      if (detail.entityType === "Character") {
        return t(`characters:${detail.entityId}`, {
          defaultValue:
            charactersById.get(detail.entityId)?.name ?? detail.entityId,
        })
      }
      return mowsById.get(detail.entityId)?.name ?? detail.entityId
    }

    const needs = aggregateShopNeeds({
      members,
      details,
      playerCharacterById,
      playerMowById,
      inventoryShardById,
      inventoryUpgradeAmountById,
      upgradesById,
      charactersById,
      mowsById,
      ascensionCostsById,
      unlockShardCostsById,
      getCharacter: (id) => {
        const record = charactersById.get(id)
        return record ? mapCharacterStorageToDomain(record) : undefined
      },
      getUnitLabel,
    })

    const rosterUnit = (unit: {
      unitId: string
      progressionIndex: string
    }): RosterUnit => ({
      unitId: unit.unitId,
      stars: progressionStarsIndex(unit.progressionIndex as never),
    })
    const powerLevel = playerDetails?.powerLevel ?? 0
    return {
      needs,
      powerLevel,
      lockContext: computeShopLockContext(
        powerLevel,
        rosterCharacters.map(rosterUnit),
        rosterMows.map(rosterUnit)
      ),
      upgradesById,
      charactersById,
      mowsById,
      equipmentById,
    }
  }, [members, data, details, t])

  const retry = () => {
    globalPlan.retry()
    read.retry()
  }

  if (globalPlan.isError || read.status === "error") {
    return { status: "error", retry }
  }
  if (!computed) return { status: "loading" }
  return {
    status: "ready",
    ...computed,
    activeGoalCount: activeMembers.length,
    retry,
  }
}
