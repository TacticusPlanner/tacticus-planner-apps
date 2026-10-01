import { DOW_MAP, type ShopShardOffer } from "@workspace/game-catalog"

import {
  mythicShardResourceId,
  shardResourceId,
  type FlatSupplier,
} from "../model/estimate.domain"

/**
 * A selected shop offer's flat per-day shard supply (spec: *A selected shop source supplies a
 * bounded, expected-value per-day amount*): `shardsPerPurchase * maxPurchasesPerDay *
 * probabilityByDay[weekday]` on each weekday the offer can appear, zero otherwise — the rotating-
 * slot probability already folded in by `resolveUnitShardShopOffers`. `referenceDate` anchors the
 * engine's 0-based day index to a real UTC weekday, the same reference date passed to `estimateGoal`/
 * `estimatePlan`.
 */
export function projectShopSupply(
  offer: ShopShardOffer,
  referenceDate: Date
): FlatSupplier {
  const resourceId = offer.isMythic
    ? mythicShardResourceId(offer.unitId)
    : shardResourceId(offer.unitId)

  return {
    key: offer.offerId,
    resourceId,
    shop: {
      shardsPerPurchase: offer.rewardQty,
      currency: offer.cost.currency,
      cost: offer.cost.amount,
    },
    supplyOnDay: (dayIndex) => {
      const weekday = DOW_MAP[(referenceDate.getUTCDay() + dayIndex) % 7]!
      const probability = offer.probabilityByDay[weekday] ?? 0
      if (probability <= 0) return 0
      return offer.rewardQty * offer.maxPerDay * probability
    },
  }
}

/** The current Onslaught run cadence (runs per day) the estimate and the creation preview both
 *  assume — matches V1. */
export const ONSLAUGHT_RUNS_PER_DAY = 1.5

/** A shop offer's expected shard supply averaged to a per-day rate — its expected purchasable
 *  shards on each weekday it can appear (`rewardQty * maxPerDay * probabilityByDay[weekday]`)
 *  summed over the week and divided by 7. Used to show every source group's yield in one
 *  comparable "shards/day" unit in the goal-creation picker
 *  (align-acquisition-source-yield-estimates); weekday-anchor-independent, unlike
 *  `projectShopSupply`'s per-day function. */
export function shopOfferShardsPerDay(offer: ShopShardOffer): number {
  const weekly = offer.days.reduce((total, weekday) => {
    const probability = offer.probabilityByDay[weekday] ?? 0
    if (probability <= 0) return total
    return total + offer.rewardQty * offer.maxPerDay * probability
  }, 0)
  return weekly / 7
}

/**
 * A selected Onslaught source's flat per-day shard supply (spec: *A selected Onslaught source
 * supplies its per-run shard yield*) — a constant `avgShardsPerRun * runsPerDay` every day,
 * consuming no daily energy, at the current Onslaught run cadence (`runsPerDay`, default
 * `ONSLAUGHT_RUNS_PER_DAY` — matching V1 and the pre-existing progression preview).
 */
export function projectOnslaughtSupply({
  entityId,
  isMythic,
  avgShardsPerRun,
  runsPerDay = ONSLAUGHT_RUNS_PER_DAY,
}: {
  entityId: string
  isMythic: boolean
  avgShardsPerRun: number
  runsPerDay?: number
}): FlatSupplier {
  const supply = Math.max(0, avgShardsPerRun) * runsPerDay
  return {
    key: isMythic ? "onslaught:mythic" : "onslaught:regular",
    resourceId: isMythic
      ? mythicShardResourceId(entityId)
      : shardResourceId(entityId),
    supplyOnDay: () => supply,
    shardsPerRun: avgShardsPerRun,
  }
}

/** Projected Onslaught tokens (runs) from what each Onslaught supplier supplied (V1 `oTokensTotal`:
 *  shards from Onslaught over the shards per run, rounded up); 0 when none contributed. */
export function onslaughtTokensFromSupply(
  bySupplier: ReadonlyMap<string, number>,
  suppliers: readonly FlatSupplier[] | undefined
): number {
  let tokens = 0
  for (const supplier of suppliers ?? []) {
    const supplied = bySupplier.get(supplier.key) ?? 0
    if (supplier.shardsPerRun && supplied > 0) {
      tokens += Math.ceil(supplied / supplier.shardsPerRun)
    }
  }
  return tokens
}

/** Projected shop currency spent, by currency id, from what each shop supplier supplied (expected
 *  purchases = supplied shards over shards per purchase, times the offer's cost); empty when no shop
 *  offer contributed. Unrounded — consumers round once for display. */
export function shopSpendFromSupply(
  bySupplier: ReadonlyMap<string, number>,
  suppliers: readonly FlatSupplier[] | undefined
): Map<string, number> {
  const spend = new Map<string, number>()
  for (const supplier of suppliers ?? []) {
    const supplied = bySupplier.get(supplier.key) ?? 0
    if (!supplier.shop || supplied <= 0) continue
    const amount =
      (supplied / supplier.shop.shardsPerPurchase) * supplier.shop.cost
    spend.set(
      supplier.shop.currency,
      (spend.get(supplier.shop.currency) ?? 0) + amount
    )
  }
  return spend
}
