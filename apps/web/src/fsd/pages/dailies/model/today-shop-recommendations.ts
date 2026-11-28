import { useOutletContext } from "react-router"

import { useShopRecommendations } from "@/features/shops/recommendations"
import type { ShopRecommendationsViewModel } from "@/features/shops/recommendations"
import type { DailiesOutletContext } from "../ui/dailies-layout"

/** In-page anchor of the Shop recommendations card, the Shops glance tile's target. */
export const TODAY_SHOPS_ID = "today-shops"

/** Today's shop recommendations for the Dailies-wide project, read once for the card and its
 *  glance tile. */
export function useTodayShopRecommendations(): ShopRecommendationsViewModel {
  const context = useOutletContext<DailiesOutletContext>()
  return useShopRecommendations(context.projectId)
}
