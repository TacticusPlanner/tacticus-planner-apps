import type { GlobalValuesStorageModel } from "@workspace/game-catalog"

const SECONDS_PER_DAY = 86_400

/** Energy the planner credits for the daily ad refill; the game config has no source for it. */
const AD_ENERGY = 90

/** The dearest refill the planner offers: the game's 1500-gem refill is left out. */
const MAX_PLANNED_REFILL_GEMS = 1000

/** Where a tier's last step of energy comes from: the free regeneration, the ad, or a gem refill. */
export type DailyEnergySource = "free" | "ad" | { gems: number }

export type DailyEnergyTier = { energy: number; source: DailyEnergySource }

/**
 * The daily energy levels the Planning Settings slider offers: the day's free regeneration
 * (`86400 / staminaRegenerationTime × staminaRegenerationAmount`, 288 today), plus the ad, plus each
 * stamina-shop refill in game order. A refill at a gem cost already offered (the game's second
 * 25-gem refill, a variant of the first) and refills above 1000 gems are skipped.
 */
export function dailyEnergyTiers(
  globalValues: Pick<
    GlobalValuesStorageModel,
    "staminaRegenerationTime" | "staminaRegenerationAmount" | "staminaShopTiers"
  >
): DailyEnergyTier[] {
  const free =
    Math.floor(SECONDS_PER_DAY / globalValues.staminaRegenerationTime) *
    globalValues.staminaRegenerationAmount
  const tiers: DailyEnergyTier[] = [
    { energy: free, source: "free" },
    { energy: free + AD_ENERGY, source: "ad" },
  ]
  const offeredGems = new Set<number>()
  let energy = free + AD_ENERGY
  for (const refill of globalValues.staminaShopTiers) {
    if (refill.gems > MAX_PLANNED_REFILL_GEMS || offeredGems.has(refill.gems))
      continue
    offeredGems.add(refill.gems)
    energy += refill.stamina
    tiers.push({ energy, source: { gems: refill.gems } })
  }
  return tiers
}

/** A module-level selector over the one-record `global-values` dataset (null until it is served). */
export function toDailyEnergyTiers(
  records: readonly GlobalValuesStorageModel[]
): DailyEnergyTier[] | null {
  return records[0] ? dailyEnergyTiers(records[0]) : null
}

/** The slider's label for a tier: Free, Ad, or the refill's gem cost ("25 BS"). */
export function energySourceLabel(source: DailyEnergySource): string {
  if (source === "free") return "Free"
  if (source === "ad") return "Ad"
  return `${source.gems} BS`
}
