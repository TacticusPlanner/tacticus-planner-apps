import type { LegendaryEventRosterUnit } from "../model/types"
import type { ClearEstimateConfig } from "./clear-estimate"

/** Uthar Alpha battles 1–7 (catalog `lre-battles` power). */
export const UTHAR_ALPHA_POWERS = [
  1018, 3055, 8199, 20703, 40586, 75787, 134603,
] as const

/** Gold1 / Epic:RedOneStar / 3 upgrades / active 20 / passive 15 → combat power 8,792. */
export function rosterUnit(unitId: string): LegendaryEventRosterUnit {
  return {
    unitId: unitId as LegendaryEventRosterUnit["unitId"],
    rank: "Gold1",
    progressionIndex: "Epic:RedOneStar",
    appliedUpgradeSlots: [0, 1, 2],
    abilities: [
      { abilityId: "active", level: 20 },
      { abilityId: "passive", level: 15 },
    ] as LegendaryEventRosterUnit["abilities"],
  }
}

export function rosterOf(
  unitIds: readonly string[]
): ReadonlyMap<string, LegendaryEventRosterUnit> {
  return new Map(unitIds.map((unitId) => [unitId, rosterUnit(unitId)]))
}

export const WORKED_TEAM = [
  "ultraCalgar",
  "ultraTigurius",
  "ultraTitus",
  "ultraApothecary",
  "ultraEliminatorSgt",
] as const

export const WORKED_CONFIG: ClearEstimateConfig = {
  powerRatio: 0.5,
  calibrated: true,
  coefficients: new Map([["ultraTigurius", 1.2]]),
}
