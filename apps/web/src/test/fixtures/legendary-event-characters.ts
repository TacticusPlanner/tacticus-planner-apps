// Every catalog character with the fields Legendary Event objective matching reads, built from the
// real catalog source (tacticus-planner-api GameCatalog Data/units): faction and alliance come from
// the unit's faction file, the rest verbatim. The `lres` fixtures' `availableUnitIds` are derived
// from this list with the server's rule (LreDenormalizer: Alliance / Faction filters only).
import type { GameCatalogCharacterView } from "@workspace/game-catalog"

import characters from "./legendary-event-characters.json"

type FixtureCharacter = Pick<
  GameCatalogCharacterView,
  | "id"
  | "name"
  | "faction"
  | "alliance"
  | "meleeDamage"
  | "meleeHits"
  | "rangedDamage"
  | "rangedHits"
  | "traits"
  | "activeAbilityDamage"
  | "passiveAbilityDamage"
>

export const legendaryEventCharacters =
  characters as unknown as FixtureCharacter[]

export function fixtureCharacter(id: string): FixtureCharacter {
  const character = legendaryEventCharacters.find((unit) => unit.id === id)
  if (!character) throw new Error(`No fixture character ${id}`)
  return character
}
