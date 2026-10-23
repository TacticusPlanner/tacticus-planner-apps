import type { Progression, Rarity } from "@workspace/game-domain"

import { utharEvent } from "@/test/fixtures/legendary-events"
import { unitPowerContextFixture } from "@/test/fixtures/unit-power"

import type { LegendaryEventRosterUnit } from "../model/types"
import type { ClearEstimateConfig } from "./clear-estimate"
import { buildLanePointsModel } from "./lane-points-model"
import { buildSyncedLaneProgress } from "./synced-lane-progress"

/** Uthar Alpha battles 1–7 (catalog `lre-battles` power). */
export const UTHAR_ALPHA_POWERS = [
  1018, 3055, 8199, 20703, 40586, 75787, 134603,
] as const

/** Uthar Alpha battle 8's power: Goals Preview's Tigurius example stops before it (Stage 6). */
export const UTHAR_ALPHA_BATTLE_8_POWER = 225385

/** Gold1 / Epic:RedOneStar / slots 0–2 / active 20 / passive 15 / no items. In-game power
 *  (Epic:RedOneStar → RedTwoStars → RedThreeStars): Calgar 21,675 → 24,155 → 26,785, Tigurius
 *  16,672 → 18,557 → 20,569, Titus 21,883 → 24,419 → 27,074, Incisus (`ultraApothecary`) 24,753 →
 *  27,662 → 30,680, Certus (`ultraEliminatorSgt`) 13,912 → 15,476 → 17,121. */
export function rosterUnit(
  unitId: string,
  progressionIndex: Progression = "Epic:RedOneStar"
): LegendaryEventRosterUnit {
  return {
    unitId: unitId as LegendaryEventRosterUnit["unitId"],
    rank: "Gold1",
    progressionIndex,
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

/** The spec worked examples' config: power ratio 1.2, Tigurius in a 1.2 horde-mode tier, and the
 *  real power formula over the fixture catalog. */
export const WORKED_CONFIG: ClearEstimateConfig = {
  powerRatio: 1.2,
  calibrated: true,
  hordeMultipliers: new Map([["ultraTigurius", 1.2]]),
  unitPower: unitPowerContextFixture(),
}

/** The worked config with the `unit-power` dataset absent (power data unavailable). */
export const UNAVAILABLE_CONFIG: ClearEstimateConfig = {
  ...WORKED_CONFIG,
  unitPower: null,
}

/** The catalog `initialRarity` of the worked units (Stage 6 unlock step and Goals Preview). */
const WORKED_INITIAL_RARITY: Readonly<Record<string, Rarity>> = {
  ultraCalgar: "Legendary",
  ultraTigurius: "Uncommon",
  ultraTitus: "Epic",
  ultraApothecary: "Common",
  ultraEliminatorSgt: "Common",
  ultraInceptorSgt: "Common",
}

export const workedInitialRarity = (unitId: string): Rarity | undefined =>
  WORKED_INITIAL_RARITY[unitId]

/** Uthar Alpha's points model (18 battles) and its worked synced progress: battle 1 has defeat-all
 *  and Ultramarines cleared at high score 29, battle 2 defeat-all at 31 (Stage 6). */
export const UTHAR_ALPHA_MODEL = buildLanePointsModel(utharEvent.alpha)
export const UTHAR_ALPHA_PROGRESS = buildSyncedLaneProgress(UTHAR_ALPHA_MODEL, {
  encounters: [
    { objectivesCleared: [0, 1], highScore: 29, encounterPoints: 29 },
    { objectivesCleared: [0], highScore: 31, encounterPoints: 31 },
  ],
})
