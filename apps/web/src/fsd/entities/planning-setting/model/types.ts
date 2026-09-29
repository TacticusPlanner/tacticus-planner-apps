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

/** A missing/unrecognized stored rarity behaves as Legendary (surface-goal-farming-guidance) — the
 * one normalization point every rarity-consuming function funnels through, so a bad stored value
 * degrades to today's Legendary-only figures rather than throwing or silently reading as 0. */
export function normalizeXpBookRarity(
  rarity: string | null | undefined
): Rarity {
  return rarity && (xpBookRarityOptions as readonly string[]).includes(rarity)
    ? (rarity as Rarity)
    : "Legendary"
}

export const dailyEnergyTiers = [
  288, 378, 438, 538, 638, 738, 838, 938,
] as const
