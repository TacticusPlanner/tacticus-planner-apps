import { progressionStarsIndex, type Progression } from "@workspace/game-domain"

import type { GameCatalogShop, GameCatalogShopVariant } from "../record-types"
import type { ShopDayOfWeek } from "../schemas/shops"

export type { ShopDayOfWeek } from "../schemas/shops"

/**
 * Ported from V1 `tacticusplanner/src/fsd/4-entities/shops/shop-resolve.ts` + `mythic-tier.ts`
 * (develop @ 2026-09, the `1.42`-era datamine). Kept deliberately close to the V1 source: the lockId
 * branch lists in `lockIsActive` / `resolveEventLockId` and their unrecognized-lock fallbacks are
 * copied verbatim. The one shape change: the served catalog already reduces each variant's Quartz
 * `cronSchedule` to an explicit `days: DayOfWeek[]` list and parses `reward`/`freeOffer`/`cost`, so
 * `cronMatchesDay` collapses to an `includes` and there is no `"type:qty"` parsing here.
 */

/** UTC day-of-week index (`Date#getUTCDay`, 0 = Sunday) → the catalog's day token. */
export const DOW_MAP: readonly ShopDayOfWeek[] = [
  "SUN",
  "MON",
  "TUE",
  "WED",
  "THU",
  "FRI",
  "SAT",
]

export function todayDow(now: number = Date.now()): ShopDayOfWeek {
  return DOW_MAP[new Date(now).getUTCDay()]!
}

// --- roster / power-level tier context (V1 mythic-tier.ts) -----------------------------------------

/** "Max legendary" = first blue star or higher (also covers all of Mythic). V1 `RarityStars.OneBlueStar`. */
const MAX_LEGENDARY_STARS_THRESHOLD = progressionStarsIndex(
  "Legendary:OneBlueStar" as Progression
)

/** V1 `PL_MEDIUM`: `< PL_MEDIUM` → low; `>= PL_MEDIUM` → medium, or high when a blue-star unit is owned. */
export const PL_MEDIUM = 20

/**
 * The four mythic upgrade materials the game only sells (never craftable), so a mythic-material goal
 * need can only be met from a shop. Ported from V1 `mythic-tier.ts` (icons dropped — resolved by id in
 * V2).
 */
export const MYTHIC_UNCRAFTABLE_UPGRADES = [
  { id: "upgHpM001", material: "Imperial Aquila" },
  { id: "upgHpM002", material: "Mutant Form" },
  { id: "upgHpM003", material: "Ancient Inscription" },
  { id: "upgHpM004", material: "Venerable Battle Mark" },
] as const

export const MYTHIC_UNCRAFTABLE_UPGRADE_IDS: readonly string[] =
  MYTHIC_UNCRAFTABLE_UPGRADES.map((upgrade) => upgrade.id)

export interface RosterUnit {
  /** snowprintId / catalog unit id. */
  unitId: string
  /** Progression stars index (`progressionStarsIndex(unit.progressionIndex)`), same scale as the threshold. */
  stars: number
}

/** Roster/power-level tier context used to resolve roster-dependent shop lockIds. */
export interface ShopLockContext {
  tier?: "low" | "medium" | "high"
  /** unitId → progression stars index, merged across characters and MoWs. */
  starsByUnitId?: Record<string, number>
}

export function plTier(
  powerLevel: number,
  hasBlueStarUnit: boolean
): "high" | "medium" | "low" {
  if (powerLevel >= PL_MEDIUM && hasBlueStarUnit) return "high"
  if (powerLevel >= PL_MEDIUM) return "medium"
  return "low"
}

/** True if the roster owns at least one unit at Legendary-blue-star-or-above (includes all of Mythic). */
export function hasBlueStarUnit(units: readonly RosterUnit[]): boolean {
  return units.some((unit) => unit.stars >= MAX_LEGENDARY_STARS_THRESHOLD)
}

export function computeShopLockContext(
  powerLevel: number,
  characters: readonly RosterUnit[],
  mows: readonly RosterUnit[]
): ShopLockContext {
  const starsByUnitId: Record<string, number> = {}
  for (const unit of [...characters, ...mows]) {
    starsByUnitId[unit.unitId] = unit.stars
  }

  return {
    tier: plTier(powerLevel, hasBlueStarUnit([...characters, ...mows])),
    starsByUnitId,
  }
}

// --- lockId resolution (V1 shop-resolve.ts, branch lists copied verbatim) -------------------------

const BP_SEASON_40_START_MS = Date.UTC(2026, 7, 2) // 2026-08-02T00:00:00Z
const BP_SEASON_DURATION_MS = 35 * 86_400_000 // exactly 5 weeks

/** Rogue Trader's featured-legendary rotation boundary: Trajann is featured until this date, then Lucius. */
const ELDER_SHOP_FEATURED_ROTATION_MS = Date.UTC(2026, 8, 6) // 2026-09-06T00:00:00Z

export function bpSeasonStartMs(season: number): number {
  return BP_SEASON_40_START_MS + (season - 40) * BP_SEASON_DURATION_MS
}

/**
 * Strict lock resolution for goal-tracking consumers: only the bp-season windows and the roster-wide
 * "owns a blue-star unit" check are understood; every other lockId resolves to `false` (hide). This is
 * V1's `resolveShopForDay` behavior.
 */
export function lockIsActive(
  lockId: string | undefined,
  nowMs: number = Date.now(),
  ownsBlueStarUnit = false
): boolean {
  if (!lockId) return true
  const until = /^lock_valid_until_bp_season_(\d+)_start$/.exec(lockId)
  if (until) return nowMs < bpSeasonStartMs(Number(until[1]))
  const after = /^lock_valid_after_bp_season_(\d+)_start$/.exec(lockId)
  if (after) return nowMs >= bpSeasonStartMs(Number(after[1]))
  if (lockId === "lock_crusade_shop_owns_unit_at_mythic")
    return ownsBlueStarUnit
  if (lockId === "lock_crusade_shop_does_not_own_unit_at_mythic")
    return !ownsBlueStarUnit
  return false
}

/**
 * Permissive lock resolution for reference/browsing consumers: understands the roster/tier vocabulary
 * (`lock_mythic_shop_tier_*`, `lock_below_max_legendary_*`, `lock_max_legendary_*`, `lock_not_unlocked_*`,
 * the elder-shop featured rotation) and the bp-season windows, and — unlike `lockIsActive` —
 * **unrecognized lockIds default to `true` (show)**. Copied branch-for-branch from V1.
 */
export function resolveEventLockId(
  lockId: string | undefined,
  context: ShopLockContext,
  nowMs: number = Date.now()
): boolean {
  if (!lockId) return true

  const until = /^lock_valid_until_bp_season_(\d+)_start$/.exec(lockId)
  if (until) return nowMs < bpSeasonStartMs(Number(until[1]))
  const after = /^lock_valid_after_bp_season_(\d+)_start$/.exec(lockId)
  if (after) return nowMs >= bpSeasonStartMs(Number(after[1]))

  if (lockId === "lock_mythic_shop_tier_high") return context.tier === "high"
  if (lockId === "lock_mythic_shop_tier_medium")
    return context.tier === "medium"
  if (lockId === "lock_mythic_shop_tier_low") return context.tier === "low"

  if (
    lockId === "lock_elder_shop_leg_featured_currently" ||
    lockId === "lock_elder_shop_leg_featured_currently_mythic"
  ) {
    return nowMs < ELDER_SHOP_FEATURED_ROTATION_MS
  }
  if (
    lockId === "lock_elder_shop_leg_featured_next" ||
    lockId === "lock_elder_shop_leg_featured_next_mythic"
  ) {
    return nowMs >= ELDER_SHOP_FEATURED_ROTATION_MS
  }

  const starsByUnitId = context.starsByUnitId ?? {}

  // Roster-wide (not per-character): does the roster own ANY unit at blue-star-or-above?
  if (
    lockId === "lock_crusade_shop_owns_unit_at_mythic" ||
    lockId === "lock_crusade_shop_does_not_own_unit_at_mythic"
  ) {
    const ownsBlueStarUnit = Object.values(starsByUnitId).some(
      (stars) => stars >= MAX_LEGENDARY_STARS_THRESHOLD
    )
    return lockId === "lock_crusade_shop_owns_unit_at_mythic"
      ? ownsBlueStarUnit
      : !ownsBlueStarUnit
  }

  const belowMax = /^lock_below_max_legendary_(.+)$/.exec(lockId)
  if (belowMax) {
    const stars = starsByUnitId[belowMax[1]!]
    return stars !== undefined && stars < MAX_LEGENDARY_STARS_THRESHOLD
  }

  const atMax = /^lock_max_legendary_(.+)$/.exec(lockId)
  if (atMax) {
    const stars = starsByUnitId[atMax[1]!]
    return stars !== undefined && stars >= MAX_LEGENDARY_STARS_THRESHOLD
  }

  const notUnlocked = /^lock_not_unlocked_(.+)$/.exec(lockId)
  if (notUnlocked) {
    return starsByUnitId[notUnlocked[1]!] === undefined
  }

  return true
}

/**
 * True unless `rewardType` is a character-shard reward that shouldn't be offered given the roster's
 * current progress on that character: plain `shards_X` once already blue-star-or-above, or
 * `mythicShards_X` before reaching blue star. Non-shard reward types always pass. Ported from V1;
 * exported for consumers that want to additionally filter shard offers by roster progress.
 */
export function shardRewardEligible(
  rewardType: string,
  context: ShopLockContext
): boolean {
  const starsByUnitId = context.starsByUnitId ?? {}

  if (rewardType.startsWith("mythicShards_")) {
    const stars = starsByUnitId[rewardType.slice("mythicShards_".length)]
    return stars !== undefined && stars >= MAX_LEGENDARY_STARS_THRESHOLD
  }
  if (rewardType.startsWith("shards_")) {
    const stars = starsByUnitId[rewardType.slice("shards_".length)]
    return stars === undefined || stars < MAX_LEGENDARY_STARS_THRESHOLD
  }
  return true
}

// --- day / power-level matching ------------------------------------------------------------------

function dayMatches(
  variant: GameCatalogShopVariant,
  day: ShopDayOfWeek
): boolean {
  return variant.days.includes(day)
}

function variantMatchesPl(
  variant: GameCatalogShopVariant,
  powerLevel: number | undefined
): boolean {
  if (powerLevel === undefined) return true
  if (variant.minPowerLevel !== undefined && powerLevel < variant.minPowerLevel)
    return false
  if (variant.maxPowerLevel !== undefined && powerLevel > variant.maxPowerLevel)
    return false
  return true
}

// --- resolved shapes ---------------------------------------------------------------------------

export interface ResolvedShopOffer {
  rewardType: string
  /** Set only for `shards_*` / `mythicShards_*` rewards (the target unit). */
  unitId?: string
  rewardQty: number
  cost: { currency: string; amount: number }
  maxPerDay: number
  freeOfferType?: string
  /** True when every day-matching variant in the slot resolves to this same reward type. */
  isGuaranteed: boolean
}

/** One shop slot's resolved reward options for a day — `offers.length > 1` means the slot is randomized. */
export interface ResolvedShopSlot {
  offers: ResolvedShopOffer[]
}

/**
 * Groups each slot's day/PL/lock-matching variants by reward type into `ResolvedShopOffer`s, one slot
 * per `ResolvedShopSlot`. `variantMatches` decides which per-variant conditions apply — strict for
 * `resolveShopOffersForToday`, permissive for `resolveShopSlotsForDay`.
 */
function groupSlotsByRewardType(
  shop: GameCatalogShop,
  day: ShopDayOfWeek,
  variantMatches: (variant: GameCatalogShopVariant) => boolean
): ResolvedShopSlot[] {
  const slots: ResolvedShopSlot[] = []

  for (const slot of shop.slots) {
    const matching = slot.variants.filter(
      (variant) => dayMatches(variant, day) && variantMatches(variant)
    )
    if (matching.length === 0) continue

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
    slots.push({ offers })
  }

  return slots
}

export interface ResolveShopOffersForTodayOptions {
  day: ShopDayOfWeek
  powerLevel: number
  lockContext: ShopLockContext
  now?: number
}

/**
 * Goal-tracking form (V1 `resolveShopForDay`): today's flattened reward offers, each tagged
 * guaranteed-vs-random, filtered by day, power-level bounds, and strict lock resolution.
 */
export function resolveShopOffersForToday(
  shop: GameCatalogShop,
  {
    day,
    powerLevel,
    lockContext,
    now = Date.now(),
  }: ResolveShopOffersForTodayOptions
): ResolvedShopOffer[] {
  const ownsBlueStarUnit = Object.values(lockContext.starsByUnitId ?? {}).some(
    (stars) => stars >= MAX_LEGENDARY_STARS_THRESHOLD
  )

  return groupSlotsByRewardType(
    shop,
    day,
    (variant) =>
      variantMatchesPl(variant, powerLevel) &&
      lockIsActive(variant.lockId, now, ownsBlueStarUnit)
  ).flatMap((slot) => slot.offers)
}

export interface ResolveShopSlotsForDayOptions {
  powerLevel?: number
  lockContext?: ShopLockContext
  /** ANDed with the permissive PL/lock check — for rules not expressible as a lockId. */
  extraFilter?: (variant: GameCatalogShopVariant) => boolean
  now?: number
}

/**
 * Permissive browsing form (V1 `resolveShopSlotsPermissive` / `resolveFullShopForDay`): every reward
 * option per slot for `day`, grouped (not flattened). PL filtering is skipped when `powerLevel` is
 * omitted; lock resolution is permissive (unrecognized locks show). No roster context required.
 */
export function resolveShopSlotsForDay(
  shop: GameCatalogShop,
  day: ShopDayOfWeek,
  {
    powerLevel,
    lockContext = {},
    extraFilter,
    now = Date.now(),
  }: ResolveShopSlotsForDayOptions = {}
): ResolvedShopSlot[] {
  return groupSlotsByRewardType(
    shop,
    day,
    (variant) =>
      variantMatchesPl(variant, powerLevel) &&
      resolveEventLockId(variant.lockId, lockContext, now) &&
      (extraFilter?.(variant) ?? true)
  )
}

// --- goal-planning form: a unit's shard offers across every shop, with per-weekday probability ------

/**
 * One shop's character-/mythic-shard offer for a specific unit, aggregated across every weekday it can
 * appear on (plan: acquisition-source picker's Shops group, tacticus-planner-apps#103). `days` is the
 * union of weekdays the offer's slot can resolve to this unit's reward; `probabilityByDay` is, for each
 * of those days, the chance the slot actually resolves to this unit rather than another reward sharing
 * the same rotating slot — 1 for a day where this is the slot's only day-matching reward (guaranteed).
 */
export interface ShopShardOffer {
  offerId: string
  shopId: string
  unitId: string
  /** `shards_<unitId>` or `mythicShards_<unitId>`. */
  rewardType: string
  isMythic: boolean
  rewardQty: number
  cost: { currency: string; amount: number }
  maxPerDay: number
  days: ShopDayOfWeek[]
  probabilityByDay: Partial<Record<ShopDayOfWeek, number>>
}

export interface ResolveUnitShardShopOffersOptions {
  powerLevel?: number
  lockContext?: ShopLockContext
  now?: number
}

/**
 * Every shop offer for `unitId`'s character shards (regular and mythic), across all shops and every
 * weekday — not just today — each carrying the per-weekday probability that its slot actually resolves
 * to this unit's reward rather than another reward the slot could yield that day. A slot with only one
 * day-matching reward on a given day is guaranteed there (probability 1); a rotating slot's probability
 * is that variant's `weight` (default 1) over the sum of weights of every day-matching variant surviving
 * the power-level/lock filter for that day. The same `<shopId>:<rewardType>` offer appearing in more than
 * one slot of one shop is merged: its `days` are unioned and its per-day probabilities summed (clamped to
 * 1) rather than kept as separate entries — see the design's `offerId` trade-off note. No roster/lock
 * context is required (unresolvable locks default to shown, matching the permissive browsing resolver);
 * an optional `powerLevel`/`lockContext` narrows the result the same way `resolveShopSlotsForDay` does.
 */
export function resolveUnitShardShopOffers(
  shops: readonly GameCatalogShop[],
  unitId: string,
  {
    powerLevel,
    lockContext = {},
    now = Date.now(),
  }: ResolveUnitShardShopOffersOptions = {}
): ShopShardOffer[] {
  const byOfferId = new Map<string, ShopShardOffer>()

  for (const shop of shops) {
    for (const slot of shop.slots) {
      for (const day of DOW_MAP) {
        const matching = slot.variants.filter(
          (variant) =>
            dayMatches(variant, day) &&
            variantMatchesPl(variant, powerLevel) &&
            resolveEventLockId(variant.lockId, lockContext, now)
        )
        if (matching.length === 0) continue

        const totalWeight = matching.reduce(
          (sum, variant) => sum + (variant.weight ?? 1),
          0
        )
        if (totalWeight <= 0) continue

        for (const variant of matching) {
          if (variant.unitId !== unitId) continue
          const rewardType = variant.reward.type
          const isMythic = rewardType.startsWith("mythicShards_")
          if (!isMythic && !rewardType.startsWith("shards_")) continue

          const offerId = `${shop.id}:${rewardType}`
          const probability = (variant.weight ?? 1) / totalWeight

          const existing = byOfferId.get(offerId)
          if (existing) {
            if (!existing.days.includes(day)) existing.days.push(day)
            existing.probabilityByDay[day] = Math.min(
              1,
              (existing.probabilityByDay[day] ?? 0) + probability
            )
          } else {
            byOfferId.set(offerId, {
              offerId,
              shopId: shop.id,
              unitId,
              rewardType,
              isMythic,
              rewardQty: variant.reward.qty,
              cost: {
                currency: variant.cost.currency,
                amount: variant.cost.amount,
              },
              maxPerDay: variant.maxPurchasesPerDay,
              days: [day],
              probabilityByDay: { [day]: probability },
            })
          }
        }
      }
    }
  }

  return [...byOfferId.values()]
}
