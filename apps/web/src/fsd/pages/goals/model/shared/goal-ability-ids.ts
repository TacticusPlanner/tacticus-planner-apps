/** A unit's first and second ability ids: Active/Passive for a character, Primary/Secondary for a
 *  Machine of War. `undefined` for either while the catalog isn't loaded or the unit is unknown. */
export type GoalAbilityIds = readonly [string | undefined, string | undefined]

type AbilityCatalog = {
  charactersById?: ReadonlyMap<
    string,
    {
      // Optional: a partial record (an older cache, a test double) names no abilities.
      activeAbilityNames?: readonly string[]
      passiveAbilityNames?: readonly string[]
    }
  >
  mowsById?: ReadonlyMap<
    string,
    { primaryAbility?: { name: string }; secondaryAbility?: { name: string } }
  >
}

/** The ability ids an Ability goal's tracks raise, so each track can show its ability's icon. */
export function goalAbilityIds(
  entityType: string,
  entityId: string,
  { charactersById, mowsById }: AbilityCatalog
): GoalAbilityIds {
  if (entityType === "Mow") {
    const mow = mowsById?.get(entityId)
    return [mow?.primaryAbility?.name, mow?.secondaryAbility?.name]
  }
  const character = charactersById?.get(entityId)
  return [
    character?.activeAbilityNames?.[0],
    character?.passiveAbilityNames?.[0],
  ]
}
