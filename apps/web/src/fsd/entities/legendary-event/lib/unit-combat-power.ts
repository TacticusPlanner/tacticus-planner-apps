import {
  characterCombatPower,
  type CharacterCombatPowerInput,
} from "@workspace/game-domain"

import type { LegendaryEventRosterUnit } from "../model/types"

/**
 * A synced character as `characterCombatPower` input (design D1): its rank, progression, distinct
 * applied upgrade slots and ability levels, or `unlocked: false` when the roster does not hold it.
 * `abilities[0]` is the active ability and `abilities[1]` the passive, the synced order every other
 * combat-power caller reads (dailies, Guild Raid readiness).
 */
export function unitCombatPowerInput(
  rosterUnit: LegendaryEventRosterUnit | undefined
): CharacterCombatPowerInput {
  if (!rosterUnit) {
    return {
      unlocked: false,
      rank: "Stone1",
      progression: "Common:None",
      appliedUpgradeCount: 0,
      activeAbilityLevel: 1,
      passiveAbilityLevel: 1,
    }
  }
  return {
    unlocked: true,
    rank: rosterUnit.rank,
    progression: rosterUnit.progressionIndex,
    appliedUpgradeCount: new Set(rosterUnit.appliedUpgradeSlots ?? []).size,
    activeAbilityLevel: rosterUnit.abilities?.[0]?.level ?? 1,
    passiveAbilityLevel: rosterUnit.abilities?.[1]?.level ?? 1,
  }
}

/** The synced character's combat power; 0 when the roster does not hold it. */
export function unitCombatPower(
  rosterUnit: LegendaryEventRosterUnit | undefined
): number {
  return characterCombatPower(unitCombatPowerInput(rosterUnit))
}
