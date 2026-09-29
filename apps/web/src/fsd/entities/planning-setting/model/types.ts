import { rarityOrder, type Rarity } from "@workspace/game-domain"

export type PlanningSettings = {
  dailyEnergy: number
  /** Required-level guidance's XP-book equivalent rarity (surface-goal-farming-guidance) — Common
   *  through Mythic, default Legendary. The API normalizes a missing/unsupported stored value to
   *  Legendary on read; consumers still fall back the same way (see `normalizeXpBookRarity`). */
  xpBookRarity: Rarity
  revision: number
}

export const defaultPlanningSettings: PlanningSettings = {
  dailyEnergy: 288,
  xpBookRarity: "Legendary",
  revision: 0,
}

/** Every rarity the planning-settings dialog offers for `xpBookRarity`, in Common→Mythic order. */
export const xpBookRarityOptions: readonly Rarity[] = rarityOrder

export const dailyEnergyTiers = [
  288, 378, 438, 538, 638, 738, 838, 938,
] as const
