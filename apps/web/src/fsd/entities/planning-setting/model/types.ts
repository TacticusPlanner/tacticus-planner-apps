import { rarityOrder, type Rarity } from "@workspace/game-domain"

import type { ApiSchemas } from "@/shared/api"

/** Wire shape (spec: api-contract-sync). `xpBookRarity` is required-level guidance's XP-book
 *  equivalent rarity (surface-goal-farming-guidance) — Common through Mythic, default Legendary. The
 *  API normalizes a missing/unsupported stored value to Legendary on read; consumers still fall back
 *  the same way (see `normalizeXpBookRarity`). */
export type PlanningSettings = ApiSchemas["UserSettingsResponse"]

export const defaultPlanningSettings: PlanningSettings = {
  dailyEnergy: 288,
  xpBookRarity: "Legendary",
  preferences: [],
  revision: 0,
}

/** An on/off account preference (spec: user preference flags): listed in `preferences` when on. Every
 *  preference is off by default. */
export type UserPreference = PlanningSettings["preferences"][number]

/** Whether `flag` is on; a settings read without preferences reads as all off. */
export function hasPreference(
  settings: Pick<PlanningSettings, "preferences">,
  flag: UserPreference
): boolean {
  return (settings.preferences ?? []).includes(flag)
}

/** Whether the player watches the daily Legendary Event ad (on unless Skip daily ads is). */
export function watchesDailyAds(
  settings: Pick<PlanningSettings, "preferences">
): boolean {
  return !hasPreference(settings, "LegendaryEventSkipDailyAds")
}

/** `settings` with `flag` turned on or off (the other flags kept). */
export function withPreference(
  settings: PlanningSettings,
  flag: UserPreference,
  on: boolean
): PlanningSettings {
  const others = (settings.preferences ?? []).filter((entry) => entry !== flag)
  return { ...settings, preferences: on ? [...others, flag] : others }
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
