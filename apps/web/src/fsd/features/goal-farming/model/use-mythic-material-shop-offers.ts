import { useMemo } from "react"
import { useLiveQuery } from "dexie-react-hooks"

import {
  resolveMythicMaterialShopOffers,
  type ShopRewardOffer,
} from "@workspace/game-catalog"
import { getShops } from "@workspace/game-catalog/queries"
import {
  getPlayerCharacters,
  getPlayerMows,
} from "@workspace/player-data/queries"

import { rosterStarsByUnitId } from "../lib/goal-acquisition"

const FAILED = Symbol("failed")

/**
 * Every daily-shop offer of the given Mythic upgrade materials, with the roster's lock context so the
 * Crusade shop's blue-star-gated offers resolve correctly (add-mythic-material-shop-sources).
 * `offers` is `undefined` while the shops or roster are still loading — resolving without the roster
 * would silently drop the Crusade offers — and `failed` is true when either read failed.
 */
export function useMythicMaterialShopOffers(materialIds: readonly string[]): {
  offers: ShopRewardOffer[] | undefined
  failed: boolean
} {
  const data = useLiveQuery(async () => {
    try {
      const [shops, characters, mows] = await Promise.all([
        getShops(),
        getPlayerCharacters(),
        getPlayerMows(),
      ])
      return { shops, units: [...(characters ?? []), ...(mows ?? [])] }
    } catch {
      return FAILED
    }
  }, [])

  const key = materialIds.join(",")
  const offers = useMemo(() => {
    if (!data || data === FAILED || !data.shops) return undefined
    return resolveMythicMaterialShopOffers(data.shops, key.split(","), {
      lockContext: { starsByUnitId: rosterStarsByUnitId(data.units) },
    })
  }, [data, key])

  return { offers, failed: data === FAILED }
}
