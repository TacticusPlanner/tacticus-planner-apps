import { useMemo } from "react"
import { useTranslation } from "react-i18next"
import {
  computeShopLockContext,
  todayDow,
  type RosterUnit,
  type ShopStorageModel,
  type UpgradeStorageModel,
} from "@workspace/game-catalog"
import { progressionStarsIndex } from "@workspace/game-domain"

import { useGlobalGoalPlan, type GoalDetail } from "@/entities/goal"
import {
  mapCharacterStorageToDomain,
  mapUpgradeStorageToDomain,
} from "@/features/rank-lookup/@x/shop-recommendations"
import {
  shopRewardDisplay,
  type ShopRewardDisplayContext,
  type ShopRewardKind,
} from "@/features/shop-rewards/@x/shop-recommendations"

import { activeProjectMembers } from "@/features/daily-raids/@x/shop-recommendations"
import { combineReadStates } from "@/shared/lib"
import { toById, useCatalogDataset, usePlayerChunk } from "@/shared/local-data"
import { aggregateShopNeeds } from "./shop-needs"
import {
  buildShopRecommendations,
  type ShopRecommendationCard,
} from "./shop-recommendations"

export interface ShopRecommendationCardView extends ShopRecommendationCard {
  rewardName: string
  rewardIconUrl?: string
  rewardKind: ShopRewardKind
}

export interface ShopRecommendationSectionView {
  shopId: string
  guaranteed: ShopRecommendationCardView[]
  possible: ShopRecommendationCardView[]
}

export type ShopRecommendationsViewModel =
  | { status: "loading" }
  | { status: "error"; retry: () => void }
  | { status: "no-goals" }
  | { status: "ready"; sections: ShopRecommendationSectionView[] }

// Shop dataset order — sections render in this order regardless of the stored row order.
const SHOP_ORDER = ["guild", "war", "rogue-trader", "crusade"]

const toUpgradesById = (records: UpgradeStorageModel[]) =>
  new Map(records.map((item) => [item.id, mapUpgradeStorageToDomain(item)]))

const toOrderedShops = (shops: ShopStorageModel[]) =>
  [...shops].sort(
    (left, right) => SHOP_ORDER.indexOf(left.id) - SHOP_ORDER.indexOf(right.id)
  )

// undefined until the inventory has synced once, which keeps the recommendations loading.
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

/** `projectId` undefined means every Active goal in the account's global order; a project narrows
 * the offers to its members. */
export function useShopRecommendations(
  projectId: string | undefined
): ShopRecommendationsViewModel {
  const { t } = useTranslation([
    "shops",
    "characters",
    "upgrades",
    "equipmentItems",
  ])

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
  const shopsRead = useCatalogDataset("shops", toOrderedShops)
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
        shopsRead,
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
      shopsRead,
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

  const sections = useMemo<ShopRecommendationSectionView[] | null>(() => {
    if (!members || !data) return null
    const [
      charactersById,
      mowsById,
      equipmentById,
      upgradesById,
      ascensionCostsById,
      unlockShardCostsById,
      shops,
      inventoryUpgradeAmountById,
      playerDetails,
      rosterCharacters,
      rosterMows,
      playerCharacterById,
      playerMowById,
      inventoryShardById,
    ] = data
    if (!inventoryUpgradeAmountById) return null

    const rewardContext = { t, charactersById, mowsById, equipmentById }

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
    const lockContext = computeShopLockContext(
      playerDetails?.powerLevel ?? 0,
      rosterCharacters.map(rosterUnit),
      rosterMows.map(rosterUnit)
    )

    return buildShopRecommendations({
      shops,
      needs,
      day: todayDow(),
      powerLevel: playerDetails?.powerLevel ?? 0,
      lockContext,
      upgradesById,
    }).map((section) => ({
      shopId: section.shopId,
      guaranteed: section.guaranteed.map((card) =>
        enrichCard(card, rewardContext)
      ),
      possible: section.possible.map((card) => enrichCard(card, rewardContext)),
    }))
  }, [members, data, details, t])

  const retry = () => {
    globalPlan.retry()
    read.retry()
  }

  if (globalPlan.isError || read.status === "error") {
    return { status: "error", retry }
  }
  if (!sections) return { status: "loading" }
  if (activeMembers.length === 0) return { status: "no-goals" }
  return { status: "ready", sections }
}

function enrichCard(
  card: ShopRecommendationCard,
  rewardContext: ShopRewardDisplayContext
): ShopRecommendationCardView {
  const display = shopRewardDisplay(card.rewardType, card.unitId, rewardContext)
  return {
    ...card,
    rewardKind: display.kind,
    rewardName: display.label,
    rewardIconUrl: display.iconUrl,
  }
}
