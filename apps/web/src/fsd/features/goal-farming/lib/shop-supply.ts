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
    resourceId,
    supplyOnDay: (dayIndex) => {
      const weekday = DOW_MAP[(referenceDate.getUTCDay() + dayIndex) % 7]!
      const probability = offer.probabilityByDay[weekday] ?? 0
      if (probability <= 0) return 0
      return offer.rewardQty * offer.maxPerDay * probability
    },
  }
}

/**
 * A selected Onslaught source's flat per-day shard supply (spec: *A selected Onslaught source
 * supplies its per-run shard yield*) — a constant `avgShardsPerRun * runsPerDay` every day,
 * consuming no daily energy, at the current Onslaught run cadence (`runsPerDay`, default 1.5 —
 * matching V1 and the pre-existing progression preview).
 */
export function projectOnslaughtSupply({
  entityId,
  isMythic,
  avgShardsPerRun,
  runsPerDay = 1.5,
}: {
  entityId: string
  isMythic: boolean
  avgShardsPerRun: number
  runsPerDay?: number
}): FlatSupplier {
  const supply = Math.max(0, avgShardsPerRun) * runsPerDay
  return {
    resourceId: isMythic
      ? mythicShardResourceId(entityId)
      : shardResourceId(entityId),
    supplyOnDay: () => supply,
  }
}
