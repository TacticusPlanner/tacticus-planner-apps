/** The distinct damage types a character can deal: its melee type, its ranged type (when it has
 * one), and any ability damage types. `activeAbilityDamage` / `passiveAbilityDamage` are declared
 * with a `.default([])` on the catalog schema, but that only backfills freshly-parsed network
 * responses — catalog rows cached in IndexedDB before that schema change never went through the
 * parse, so the fields can still be `undefined` on an already-synced device. Accept them as
 * optional and guard. */
type CharacterDamageSource = {
  meleeDamage: string
  rangedDamage: string | null
  activeAbilityDamage?: readonly string[]
  passiveAbilityDamage?: readonly string[]
}

export function characterDamageTypes(
  character: CharacterDamageSource
): string[] {
  return [
    ...new Set(
      [
        character.meleeDamage,
        character.rangedDamage ?? undefined,
        ...(character.activeAbilityDamage ?? []),
        ...(character.passiveAbilityDamage ?? []),
      ].filter((type): type is string => Boolean(type))
    ),
  ]
}
