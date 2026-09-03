import { useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import { useLiveQuery } from "dexie-react-hooks"
import {
  resolveShopSlotsForDay,
  todayDow,
  type ShopDayOfWeek,
} from "@workspace/game-catalog"
import {
  getCharactersMap,
  getMowsMap,
  getShopsMap,
} from "@workspace/game-catalog/queries"

import { shopRewardDisplay } from "@/features/shop-rewards"

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
  const { t } = useTranslation(["shops", "characters", "upgrades"])
  const [day, setDay] = useState<ShopDayOfWeek>(() => todayDow())
  const [shopId, setShopId] = useState<LibraryShopId>("guild")
  const [retryNonce, setRetryNonce] = useState(0)

  // useLiveQuery swallows a thrown error into `undefined` forever, which is indistinguishable from
  // "still loading"; wrapping the read lets the page show a real retry-able failure state.
  const catalog = useLiveQuery(async () => {
    try {
      const [shops, characters, mows] = await Promise.all([
        getShopsMap(),
        getCharactersMap(),
        getMowsMap(),
      ])
      return { ok: true as const, shops, characters, mows }
    } catch {
      return { ok: false as const }
    }
  }, [retryNonce])

  const slots = useMemo<LibraryShopSlotView[] | null>(() => {
    if (!catalog?.ok) return null
    const shop = catalog.shops.get(shopId)
    if (!shop) return []

    const rewardContext = {
      t,
      charactersById: catalog.characters,
      mowsById: catalog.mows,
    }

    return buildLibraryShopSlots(resolveShopSlotsForDay(shop, day), (offer) => {
      const display = shopRewardDisplay(
        offer.rewardType,
        offer.unitId,
        rewardContext
      )
      return { label: display.label, iconUrl: display.iconUrl }
    })
  }, [catalog, shopId, day, t])

  if (catalog && !catalog.ok) {
    return { status: "error", retry: () => setRetryNonce((value) => value + 1) }
  }
  if (!slots) return { status: "loading" }
  return { status: "ready", day, setDay, shopId, setShopId, slots }
}
