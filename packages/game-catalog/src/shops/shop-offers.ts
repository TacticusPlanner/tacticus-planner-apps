import type { GameCatalogShopVariant } from "../record-types"
import type { ResolvedShopOffer } from "./shop-resolve"

/**
 * Groups one slot's already-matching variants by reward type into `ResolvedShopOffer`s, flagged
 * guaranteed when they all resolve to one reward type. Shared by the shop resolvers here and the
 * event-shop day helpers (`./event-days.ts`), which choose their own variant filter.
 */
export function groupVariantsByRewardType(
  matching: readonly GameCatalogShopVariant[]
): ResolvedShopOffer[] {
  const byRewardType = new Map<string, GameCatalogShopVariant[]>()
  for (const variant of matching) {
    const bucket = byRewardType.get(variant.reward.type)
    if (bucket) {
      bucket.push(variant)
    } else {
      byRewardType.set(variant.reward.type, [variant])
    }
  }

  // If all matching variants resolve to the same reward type, the slot is deterministic.
  const isGuaranteed = byRewardType.size === 1

  const offers: ResolvedShopOffer[] = []
  for (const [rewardType, variants] of byRewardType) {
    const first = variants[0]!
    offers.push({
      rewardType,
      unitId: first.unitId,
      rewardQty: first.reward.qty,
      cost: { currency: first.cost.currency, amount: first.cost.amount },
      maxPerDay: first.maxPurchasesPerDay,
      freeOfferType: first.freeOffer?.type,
      isGuaranteed,
    })
  }
  return offers
}
