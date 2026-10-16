import type { Progression, Rarity } from "@workspace/game-domain"

import { utharEvent } from "@/test/fixtures/legendary-events"

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

/** Gold1 / Epic:RedOneStar / 3 upgrades / active 20 / passive 15 → combat power 8,792
 *  (Epic:RedTwoStars → 9,299; Epic:RedThreeStars → 9,806). */
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

export const WORKED_CONFIG: ClearEstimateConfig = {
  powerRatio: 0.5,
  calibrated: true,
  hordeMultipliers: new Map([["ultraTigurius", 1.2]]),
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
} as Parameters<typeof buildSyncedLaneProgress>[1])
