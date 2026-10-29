import { rarityOrder, type Rarity } from "@workspace/game-domain"

import type { ApiSchemas } from "@/shared/api"

/** Wire shape (spec: api-contract-sync). `xpBookRarity` is required-level guidance's XP-book
 *  equivalent rarity (surface-goal-farming-guidance) — Common through Mythic, default Legendary. The
 *  API normalizes a missing/unsupported stored value to Legendary on read; consumers still fall back
 *  the same way (see `normalizeXpBookRarity`). */
export type PlanningSettings = ApiSchemas["UserSettingsResponse"]

export type GoalsView = PlanningSettings["goalsView"]

export const defaultPlanningSettings: PlanningSettings = {
  dailyEnergy: 288,
  xpBookRarity: "Legendary",
  goalsView: "Cards",
  revision: 0,
}

/** A missing/unrecognized stored Goals view behaves as Cards (goal-list-layout: Cards is the default),
 *  so a bad stored value can never strand a user in a view the toggle doesn't offer. */
export function normalizeGoalsView(view: string | null | undefined): GoalsView {
  return view === "Table" ? "Table" : "Cards"
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
