import { useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import { useQueries, useQuery } from "@tanstack/react-query"
import { useIsAuthenticated } from "@azure/msal-react"
import { useLiveQuery } from "dexie-react-hooks"
import {
  computeShopLockContext,
  todayDow,
  type RosterUnit,
} from "@workspace/game-catalog"
import {
  progressionStarsIndex,
  unitIdSchema,
  type UnitId,
} from "@workspace/game-domain"
import {
  getAscensionCostsMap,
  getCharactersMap,
  getMowsMap,
  getShops,
  getUnlockShardCostsMap,
  getUpgrades,
} from "@workspace/game-catalog/queries"
import {
  getInventoryShard,
  getInventoryUpgrades,
  getPlayerCharacter,
  getPlayerCharacters,
  getPlayerDetails,
  getPlayerMow,
  getPlayerMows,
} from "@workspace/player-data/queries"

import { goalQueries, type GoalDetail } from "@/entities/goal"
import { projectQueries } from "@/entities/project"
import {
  mapCharacterStorageToDomain,
  mapUpgradeStorageToDomain,
} from "@/features/rank-lookup"
import {
  shopRewardDisplay,
  type ShopRewardDisplayContext,
  type ShopRewardKind,
} from "@/features/shop-rewards"

import { activeProjectMembers } from "./daily-raids-calc"
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
  | { status: "no-project" }
  | { status: "ready"; sections: ShopRecommendationSectionView[] }

// Shop dataset order — sections render in this order regardless of the stored row order.
const SHOP_ORDER = ["guild", "war", "rogue-trader", "crusade"]

// `useLiveQuery` turns a rejected querier into a permanent `undefined`, indistinguishable from "still
// loading" — the player-data reads below wrap their body and return this sentinel instead, so a Dexie
// failure surfaces as a real, retry-able error state. (Catalog reads stay unwrapped: a catalog failure
// is owned by the global GameCatalogProvider gate.)
const LIVE_QUERY_ERROR = Symbol("live-query-error")
type OrLiveQueryError<T> = T | typeof LIVE_QUERY_ERROR

async function safeLiveRead<T>(
  read: () => Promise<T>
): Promise<OrLiveQueryError<T>> {
  try {
    return await read()
  } catch {
    return LIVE_QUERY_ERROR
  }
}

function playerUnitIds(
  details: readonly Pick<GoalDetail, "entityId" | "entityType">[]
) {
  const characterIds = new Set<UnitId>()
  const mowIds = new Set<UnitId>()
  for (const detail of details) {
    const parsed = unitIdSchema.safeParse(detail.entityId)
    if (!parsed.success) continue
    if (detail.entityType === "Character") characterIds.add(parsed.data)
    if (detail.entityType === "Mow") mowIds.add(parsed.data)
  }
  return { characterIds: [...characterIds], mowIds: [...mowIds] }
}

export function useShopRecommendations(
  projectId: string | undefined
): ShopRecommendationsViewModel {
  const { t } = useTranslation(["shops", "characters", "upgrades"])
  const isAuthenticated = useIsAuthenticated()
  const [retryNonce, setRetryNonce] = useState(0)

  const membersQuery = useQuery({
    ...projectQueries.goals(projectId ?? "unselected"),
    enabled: Boolean(isAuthenticated && projectId),
  })
  const activeMembers = activeProjectMembers(membersQuery.data?.goals ?? [])
  const detailQueries = useQueries({
    queries: activeMembers.map((member) =>
      goalQueries.detail(member.goal.goalId)
    ),
  })
  const details = detailQueries.flatMap((query) =>
    query.data ? [query.data] : []
  )
  const detailKey = details
    .map((detail) => `${detail.goalId}:${detail.entityType}:${detail.entityId}`)
    .join(",")

  const charactersById = useLiveQuery(() => getCharactersMap(), [])
  const mowsById = useLiveQuery(() => getMowsMap(), [])
  const upgrades = useLiveQuery(() => getUpgrades(), [])
  const ascensionCostsById = useLiveQuery(() => getAscensionCostsMap(), [])
  const unlockShardCostsById = useLiveQuery(() => getUnlockShardCostsMap(), [])
  const inventoryUpgradesRaw = useLiveQuery(
    () => safeLiveRead(() => getInventoryUpgrades()),
    [retryNonce]
  )
  const shopsRaw = useLiveQuery(
    () => safeLiveRead(() => getShops()),
    [retryNonce]
  )
  const playerDetailsRaw = useLiveQuery(
    () => safeLiveRead(async () => ({ value: await getPlayerDetails() })),
    [retryNonce]
  )
  const rosterRaw = useLiveQuery(
    () =>
      safeLiveRead(async () => ({
        characters: (await getPlayerCharacters()) ?? [],
        mows: (await getPlayerMows()) ?? [],
      })),
    [retryNonce]
  )
  const playerStateRaw = useLiveQuery(
    () =>
      safeLiveRead(async () => {
        const { characterIds, mowIds } = playerUnitIds(details)
        const [characters, mows, inventoryShards] = await Promise.all([
          Promise.all(
            characterIds.map(
              async (id) => [id, await getPlayerCharacter(id)] as const
            )
          ),
          Promise.all(
            mowIds.map(async (id) => [id, await getPlayerMow(id)] as const)
          ),
          Promise.all(
            characterIds.map(
              async (id) => [id, await getInventoryShard(id)] as const
            )
          ),
        ])
        return {
          playerCharacterById: new Map(characters),
          playerMowById: new Map(mows),
          inventoryShardById: new Map(inventoryShards),
        }
      }),
    [detailKey, retryNonce]
  )

  const liveQueryFailed = [
    inventoryUpgradesRaw,
    shopsRaw,
    playerDetailsRaw,
    rosterRaw,
    playerStateRaw,
  ].some((result) => result === LIVE_QUERY_ERROR)

  // Treat the failure sentinel as "not loaded" for the rest of the hook — the error branch below
  // short-circuits before any of these are read, but this keeps the downstream types clean.
  function unwrap<T>(result: OrLiveQueryError<T> | undefined): T | undefined {
    return result === LIVE_QUERY_ERROR ? undefined : result
  }
  const inventoryUpgrades = unwrap(inventoryUpgradesRaw)
  const shops = unwrap(shopsRaw)
  const playerDetails = unwrap(playerDetailsRaw)
  const roster = unwrap(rosterRaw)
  const playerState = unwrap(playerStateRaw)

  const upgradesById = useMemo(
    () =>
      new Map(
        (upgrades ?? []).map((item) => [
          item.id,
          mapUpgradeStorageToDomain(item),
        ])
      ),
    [upgrades]
  )
  const inventoryUpgradeAmountById = useMemo(
    () =>
      new Map(
        (inventoryUpgrades ?? []).map((entry) => [
          entry.upgradeId,
          entry.amount,
        ])
      ),
    [inventoryUpgrades]
  )

  const isReady =
    membersQuery.isSuccess &&
    detailQueries.every((query) => query.isSuccess) &&
    charactersById &&
    mowsById &&
    upgrades &&
    ascensionCostsById &&
    unlockShardCostsById &&
    inventoryUpgrades !== undefined &&
    shops &&
    playerDetails &&
    roster &&
    playerState

  const sections = useMemo<ShopRecommendationSectionView[] | null>(() => {
    if (
      !isReady ||
      !charactersById ||
      !mowsById ||
      !shops ||
      !playerState ||
      !roster ||
      !ascensionCostsById ||
      !unlockShardCostsById
    ) {
      return null
    }

    const rewardContext = { t, charactersById, mowsById }

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
      members: membersQuery.data.goals,
      details,
      playerCharacterById: playerState.playerCharacterById,
      playerMowById: playerState.playerMowById,
      inventoryShardById: playerState.inventoryShardById,
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
      playerDetails?.value?.powerLevel ?? 0,
      roster.characters.map(rosterUnit),
      roster.mows.map(rosterUnit)
    )

    const orderedShops = [...shops].sort(
      (left, right) =>
        SHOP_ORDER.indexOf(left.id) - SHOP_ORDER.indexOf(right.id)
    )

    return buildShopRecommendations({
      shops: orderedShops,
      needs,
      day: todayDow(),
      powerLevel: playerDetails?.value?.powerLevel ?? 0,
      lockContext,
    }).map((section) => ({
      shopId: section.shopId,
      guaranteed: section.guaranteed.map((card) =>
        enrichCard(card, rewardContext)
      ),
      possible: section.possible.map((card) => enrichCard(card, rewardContext)),
    }))
  }, [
    isReady,
    charactersById,
    mowsById,
    shops,
    playerState,
    roster,
    ascensionCostsById,
    unlockShardCostsById,
    membersQuery.data,
    details,
    inventoryUpgradeAmountById,
    upgradesById,
    playerDetails,
    t,
  ])

  const retry = () => {
    void membersQuery.refetch()
    for (const query of detailQueries) void query.refetch()
    setRetryNonce((nonce) => nonce + 1)
  }

  if (!projectId) return { status: "no-project" }
  if (
    membersQuery.isError ||
    detailQueries.some((query) => query.isError) ||
    liveQueryFailed
  ) {
    return { status: "error", retry }
  }
  if (!sections) return { status: "loading" }
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
