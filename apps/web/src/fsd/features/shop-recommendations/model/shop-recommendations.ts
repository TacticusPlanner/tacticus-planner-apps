import {
  resolveShopOffersForToday,
  type GameCatalogShop,
  type ResolvedShopOffer,
  type ShopDayOfWeek,
  type ShopLockContext,
} from "@workspace/game-catalog"

import {
  MYTHIC_UPGRADE_NEED_IDS,
  type ShopNeedAggregate,
  type ShopNeedUnitEntry,
} from "./shop-needs"

const MATCHABLE_NON_SHARD = new Set<string>(MYTHIC_UPGRADE_NEED_IDS)

/** Reward types this release can match against a goal need — shards, mythic shards, `upgHpM00x`. */
function isMatchableRewardType(rewardType: string): boolean {
  return (
    rewardType.startsWith("shards_") ||
    rewardType.startsWith("mythicShards_") ||
    MATCHABLE_NON_SHARD.has(rewardType)
  )
}

export interface ShopRecommendationCard {
  shopId: string
  rewardType: string
  unitId?: string
  rewardQty: number
  cost: { currency: string; amount: number }
  maxPerDay: number
  freeOfferType?: string
  /** True when today's slot always yields this reward; false when it's one of several random outcomes. */
  isGuaranteed: boolean
  acquired: number
  required: number
  /** Units still needed after what the player already has (`required - min(acquired, required)`). */
  remaining: number
  /** Currency cost to cover `remaining` at this offer's reward quantity; `0` when the need is met. */
  remainingCost: number
  neededBy: ShopNeedUnitEntry[]
}

export interface ShopRecommendationSection {
  shopId: string
  guaranteed: ShopRecommendationCard[]
  possible: ShopRecommendationCard[]
}

export interface BuildShopRecommendationsParams {
  shops: readonly GameCatalogShop[]
  needs: ShopNeedAggregate
  day: ShopDayOfWeek
  powerLevel: number
  lockContext: ShopLockContext
  now?: number
}

/**
 * Matches each shop's resolved offers for `day` against the project's aggregated goal needs, keeping
 * offers whose reward resource still has `acquired < required`, split per shop into guaranteed-today
 * and possible-today groups. Shops with no matching offer produce a section with two empty groups —
 * the page omits those.
 */
export function buildShopRecommendations({
  shops,
  needs,
  day,
  powerLevel,
  lockContext,
  now = Date.now(),
}: BuildShopRecommendationsParams): ShopRecommendationSection[] {
  return shops.map((shop) => {
    const offers =
      shop.id === "rogue-trader"
        ? rogueTraderPenultimateOffers(shop, day, now)
        : resolveShopOffersForToday(shop, { day, powerLevel, lockContext, now })

    const guaranteed: ShopRecommendationCard[] = []
    const possible: ShopRecommendationCard[] = []

    for (const offer of offers) {
      if (!isMatchableRewardType(offer.rewardType)) continue
      const need = needs.get(offer.rewardType)
      if (!need || need.acquired >= need.required) continue

      const card = toCard(shop.id, offer, need)
      ;(offer.isGuaranteed ? guaranteed : possible).push(card)
    }

    return { shopId: shop.id, guaranteed, possible }
  })
}

function toCard(
  shopId: string,
  offer: ResolvedShopOffer,
  need: { acquired: number; required: number; neededBy: ShopNeedUnitEntry[] }
): ShopRecommendationCard {
  // Mirrors V1 `ShopItemCard`: clamp acquired to the requirement, then cost the shortfall in whole
  // purchases at this offer's reward quantity.
  const displayAcquired = Math.min(Math.floor(need.acquired), need.required)
  const remaining = need.required - displayAcquired
  const remainingCost =
    remaining > 0
      ? Math.ceil(remaining / offer.rewardQty) * offer.cost.amount
      : 0

  return {
    shopId,
    rewardType: offer.rewardType,
    unitId: offer.unitId,
    rewardQty: offer.rewardQty,
    cost: offer.cost,
    maxPerDay: offer.maxPerDay,
    freeOfferType: offer.freeOfferType,
    isGuaranteed: offer.isGuaranteed,
    acquired: displayAcquired,
    required: need.required,
    remaining,
    remainingCost,
    neededBy: need.neededBy,
  }
}

// ── Rogue Trader "penultimate slot" quirk ────────────────────────────────────────────────────────
// Ported from V1 `tacticusplanner/src/fsd/4-entities/shops/rogue-trader.service.ts`
// `resolvePenultimateForDay` (develop @ 2026-09). V1's Daily Raids → Today surfaces Rogue Trader
// ONLY through its penultimate product slot (`products.at(-2)`): it filters that slot to the mythic
// uncraftable materials, strips every per-variant condition, then resolves it for the day. (V1 also
// pulls the mythic *forge badge* from that slot — that reward category is out of scope here, see
// TacticusPlanner/tacticus-planner-apps#104.) The full RT rotation, and RT's own shard offers, are
// shown by the Library browser via `resolveShopSlotsForDay`, never on this recommendations page.
function rogueTraderPenultimateOffers(
  shop: GameCatalogShop,
  day: ShopDayOfWeek,
  now: number
): ResolvedShopOffer[] {
  if (shop.slots.length <= 2) return []
  const penultimate = shop.slots[shop.slots.length - 2]!

  const strippedShop: GameCatalogShop = {
    ...shop,
    slots: [
      {
        variants: penultimate.variants
          .filter((variant) => MATCHABLE_NON_SHARD.has(variant.reward.type))
          .map((variant) => ({
            ...variant,
            lockId: undefined,
            minPowerLevel: undefined,
            maxPowerLevel: undefined,
          })),
      },
    ],
  }

  return resolveShopOffersForToday(strippedShop, {
    day,
    powerLevel: 0,
    lockContext: {},
    now,
  })
}
