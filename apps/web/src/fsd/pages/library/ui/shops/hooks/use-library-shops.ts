import { useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import {
  resolveShopSlotsForDay,
  todayDow,
  type ShopDayOfWeek,
} from "@workspace/game-catalog"

import { shopRewardDisplay } from "@/features/shop-rewards"
import { combineReadStates } from "@/shared/lib"
import { toById, useCatalogDataset } from "@/shared/local-data"

import {
  buildLibraryShopSlots,
  type LibraryShopSlotView,
} from "../library-shops.view-model"

export const LIBRARY_SHOP_IDS = [
  "guild",
  "war",
  "rogue-trader",
  "crusade",
] as const
export type LibraryShopId = (typeof LIBRARY_SHOP_IDS)[number]

export type LibraryShopsViewModel =
  | { status: "loading" }
  | { status: "error"; retry: () => void }
  | {
      status: "ready"
      day: ShopDayOfWeek
      setDay: (day: ShopDayOfWeek) => void
      shopId: LibraryShopId
      setShopId: (shopId: LibraryShopId) => void
      slots: LibraryShopSlotView[]
    }

export function useLibraryShops(): LibraryShopsViewModel {
  // Scoped to the reward-display helper's namespaces (first-ns `shops`); the page's own `library:`
  // copy is translated by the subview components, not here.
  const { t } = useTranslation([
    "shops",
    "characters",
    "upgrades",
    "equipmentItems",
  ])
  const [day, setDay] = useState<ShopDayOfWeek>(() => todayDow())
  const [shopId, setShopId] = useState<LibraryShopId>("guild")
  const read = combineReadStates(
    useCatalogDataset("shops", toById),
    useCatalogDataset("characters", toById),
    useCatalogDataset("mows", toById),
    useCatalogDataset("equipment", toById)
  )
  const [shops, characters, mows, equipment] =
    read.status === "ready" ? read.data : []

  // Keyed on each dataset (each referentially stable while unchanged), not on the combined tuple.
  const slots = useMemo<LibraryShopSlotView[] | null>(() => {
    if (!shops || !characters || !mows || !equipment) return null
    const shop = shops.get(shopId)
    if (!shop) return []

    const rewardContext = {
      t,
      charactersById: characters,
      mowsById: mows,
      equipmentById: equipment,
    }

    return buildLibraryShopSlots(resolveShopSlotsForDay(shop, day), (offer) => {
      const display = shopRewardDisplay(
        offer.rewardType,
        offer.unitId,
        rewardContext
      )
      return { label: display.label, iconUrl: display.iconUrl }
    })
  }, [shops, characters, mows, equipment, shopId, day, t])

  if (read.status === "error") return { status: "error", retry: read.retry }
  if (!slots) return { status: "loading" }
  return { status: "ready", day, setDay, shopId, setShopId, slots }
}
