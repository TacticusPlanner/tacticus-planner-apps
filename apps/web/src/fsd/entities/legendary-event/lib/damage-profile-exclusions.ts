import { characterDamageTypes } from "@/shared/lib"

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

/** The damage types a unit deals for "deals damage type X" objectives (Legendary Event, Quest):
 *  `characterDamageTypes` minus the unit's damage-profile exclusions. */
export function unitDealtDamageTypes(
  unit: { id: string } & Parameters<typeof characterDamageTypes>[0]
): string[] {
  const excluded = DAMAGE_PROFILE_EXCLUSIONS[unit.id]
  const types = characterDamageTypes(unit)
  return excluded ? types.filter((type) => !excluded.includes(type)) : types
}
