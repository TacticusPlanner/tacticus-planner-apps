import { useMemo } from "react"

import {
  resolveUnitShardShopOffers,
  type ShopShardOffer,
} from "@workspace/game-catalog"

import { useCatalogDataset } from "@/shared/local-data"

/**
 * A unit's daily-shop character-shard offers (regular and mythic, across every shop and weekday) —
 * the data source behind the acquisition-source picker's Shops group and its estimate contribution
 * (tacticus-planner-apps#103). `offers` is `undefined` while the `shops` dataset is still loading;
 * an empty array once loaded means no shop currently offers this unit's shards.
 */
export function useUnitShopShardSupply(unitId: string | undefined): {
  offers: ShopShardOffer[] | undefined
} {
  const shopsRead = useCatalogDataset("shops")
  const shops = shopsRead.status === "ready" ? shopsRead.data : undefined

  const offers = useMemo(() => {
    if (!unitId || !shops) return undefined
    return resolveUnitShardShopOffers(shops, unitId)
  }, [shops, unitId])

  return { offers }
}
