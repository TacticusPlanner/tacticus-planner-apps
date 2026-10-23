import { useMemo } from "react"

import {
  resolveMythicMaterialShopOffers,
  type ShopRewardOffer,
} from "@workspace/game-catalog"

import { combineReadStates } from "@/shared/lib"
import { useCatalogDataset, usePlayerChunk } from "@/shared/local-data"

import { rosterStarsByUnitId } from "../lib/goal-acquisition"

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
  const shopsRead = useCatalogDataset("shops")
  const charactersRead = usePlayerChunk("characters")
  const mowsRead = usePlayerChunk("mows")
  const { status } = combineReadStates(shopsRead, charactersRead, mowsRead)
  const shops = shopsRead.status === "ready" ? shopsRead.data : undefined
  const characters =
    charactersRead.status === "ready" ? charactersRead.data : undefined
  const mows = mowsRead.status === "ready" ? mowsRead.data : undefined

  const key = materialIds.join(",")
  // Keyed on each read's data (each stable while unchanged), not on the combined tuple.
  const offers = useMemo(() => {
    if (status !== "ready" || !shops) return undefined
    const units = [...(characters ?? []), ...(mows ?? [])]
    return resolveMythicMaterialShopOffers(shops, key.split(","), {
      lockContext: { starsByUnitId: rosterStarsByUnitId(units) },
    })
  }, [status, shops, characters, mows, key])

  return { offers, failed: status === "error" }
}
