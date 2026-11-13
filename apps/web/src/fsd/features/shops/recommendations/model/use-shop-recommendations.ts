import { useMemo } from "react"
import { useTranslation } from "react-i18next"
import {
  todayDow,
  type GameIcon,
  type ShopStorageModel,
} from "@workspace/game-catalog"

import {
  shopRewardDisplay,
  type ShopRewardDisplayContext,
  type ShopRewardKind,
} from "@/features/shops/rewards/@x/shops/recommendations"

import { useCatalogDataset } from "@/shared/local-data"
import {
  buildShopRecommendations,
  type ShopRecommendationCard,
} from "./shop-recommendations"
import { useShopNeeds } from "./use-shop-needs"

export interface ShopRecommendationCardView extends ShopRecommendationCard {
  rewardName: string
  rewardIconUrl?: GameIcon
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

const toOrderedShops = (shops: ShopStorageModel[]) =>
  [...shops].sort(
    (left, right) => SHOP_ORDER.indexOf(left.id) - SHOP_ORDER.indexOf(right.id)
  )

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
  const needsState = useShopNeeds(projectId)
  const shopsRead = useCatalogDataset("shops", toOrderedShops)
  const shops = shopsRead.status === "ready" ? shopsRead.data : undefined

  const sections = useMemo<ShopRecommendationSectionView[] | null>(() => {
    if (needsState.status !== "ready" || !shops) return null
    const {
      needs,
      powerLevel,
      lockContext,
      upgradesById,
      charactersById,
      mowsById,
      equipmentById,
    } = needsState
    const rewardContext = { t, charactersById, mowsById, equipmentById }

    return buildShopRecommendations({
      shops,
      needs,
      day: todayDow(),
      powerLevel,
      lockContext,
      upgradesById,
    }).map((section) => ({
      shopId: section.shopId,
      guaranteed: section.guaranteed.map((card) =>
        enrichCard(card, rewardContext)
      ),
      possible: section.possible.map((card) => enrichCard(card, rewardContext)),
    }))
  }, [needsState, shops, t])

  const retry = () => {
    if (needsState.status !== "loading") needsState.retry()
    shopsRead.retry()
  }

  if (needsState.status === "error" || shopsRead.status === "error") {
    return { status: "error", retry }
  }
  if (needsState.status !== "ready" || !sections) return { status: "loading" }
  if (needsState.activeGoalCount === 0) return { status: "no-goals" }
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
