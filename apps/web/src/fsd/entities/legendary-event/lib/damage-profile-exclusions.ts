import { characterDamageTypes } from "@/shared/lib"

import type { LegendaryEventUnit } from "../model/types"

/**
 * Ability damage a unit reduces or reacts to rather than deals, ported from V1's
 * `damage-profile-exclusions.ts`. The catalog lists these in the unit's ability damage, which would
 * otherwise make it satisfy a "deals damage type X" objective it cannot meet in game. V1 knew the
 * direct-damage id as `Direct`; the V2 catalog emits `DirectDamage`, so both are listed.
 */
const DAMAGE_PROFILE_EXCLUSIONS: Readonly<Record<string, readonly string[]>> = {
  votanChampion: ["Psychic", "Direct", "DirectDamage"],
  thousSekhetar: ["Psychic"],
}

/** The damage types a unit deals for Legendary Event objectives: `characterDamageTypes` minus the
 *  unit's damage-profile exclusions. */
export function unitDealtDamageTypes(unit: LegendaryEventUnit): string[] {
  const excluded = DAMAGE_PROFILE_EXCLUSIONS[unit.id]
  const types = characterDamageTypes(unit)
  return excluded ? types.filter((type) => !excluded.includes(type)) : types
}
