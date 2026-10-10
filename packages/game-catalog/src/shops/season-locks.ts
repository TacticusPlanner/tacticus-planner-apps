/**
 * Time-gated shop lockIds: battle pass season windows, crusade season 2 swaps and the war shop epic
 * rotation. Ported from V1 `tacticusplanner/src/fsd/4-entities/shops/shop-resolve.ts` (1.43).
 */

const BP_SEASON_40_START_MS = Date.UTC(2026, 7, 2) // 2026-08-02T00:00:00Z
const BP_SEASON_DURATION_MS = 35 * 86_400_000 // exactly 5 weeks

/** Crusade season 2 begins here; season-gated crusade/war shop variants swap at this instant. */
const CRUSADE_SEASON_2_START_MS = Date.UTC(2026, 9, 20) // 2026-10-20T00:00:00Z

/** Battle pass season (starts 2026-10-11T00:00:00Z) whose epic character rotation the war shop's `*_epic_*` locks follow. */
const EPIC_ROTATION_BP_SEASON = 42

/** Crusade shop slots 1-3 feature a different hero per season. */
const CRUSADE_SLOT_HEROES: Record<
  string,
  { season1: string; season2: string }
> = {
  "1": { season1: "eldarLhykhis", season2: "custoTrajann" },
  "2": { season1: "custoBladeChampion", season2: "eldarLhykhis" },
  "3": { season1: "emperNoiseMarine", season2: "thousSekhetar" },
}

export function bpSeasonStartMs(season: number): number {
  return BP_SEASON_40_START_MS + (season - 40) * BP_SEASON_DURATION_MS
}

/** Resolves crusade-season and epic-rotation lockIds; `undefined` when `lockId` isn't one. */
export function seasonLock(lockId: string, nowMs: number): boolean | undefined {
  const isSeason2 = nowMs >= CRUSADE_SEASON_2_START_MS
  if (lockId === "lock_daily_deals_crusadeSeason2start") return isSeason2
  // War shop epic-character rotation (current + next) belongs to the new battle pass season.
  if (
    /^lock_daily_deals_character_rotation_epic_(current|next)$/.test(lockId)
  ) {
    return nowMs >= bpSeasonStartMs(EPIC_ROTATION_BP_SEASON)
  }
  if (!lockId.startsWith("lock_crusade_shop_")) return undefined
  if (lockId.endsWith("_season1")) return !isSeason2
  if (lockId.endsWith("_season2")) return isSeason2
  // Slot 14 offers ammo in season 2 whenever it's available; the dust fallback is never shown.
  if (lockId === "lock_crusade_shop_slot14_season2_ammo") return isSeason2
  if (lockId === "lock_crusade_shop_slot14_season2_fallback") return false
  return undefined
}

/**
 * Crusade shop slots 1-3 hero locks (`lock_crusade_shop_slot{N}_{hero}_shards_{mythic|regular}`):
 * `false` when `hero` is not the slot's hero for the current season, otherwise the shard reward type
 * whose roster eligibility decides the lock (mythic shards once blue-star-or-above, regular shards
 * otherwise). `undefined` when `lockId` isn't one.
 */
export function crusadeSlotHeroShardReward(
  lockId: string,
  nowMs: number
): string | false | undefined {
  const match =
    /^lock_crusade_shop_slot(\d+)_(.+)_shards_(mythic|regular)$/.exec(lockId)
  if (!match) return undefined
  const [, slot, hero, variant] = match
  const heroes = CRUSADE_SLOT_HEROES[slot!]
  if (!heroes) return undefined
  if (
    hero !==
    (nowMs >= CRUSADE_SEASON_2_START_MS ? heroes.season2 : heroes.season1)
  )
    return false
  return `${variant === "mythic" ? "mythicShards" : "shards"}_${hero}`
}
