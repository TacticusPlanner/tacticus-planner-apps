import { useMemo } from "react"
import { useTranslation } from "react-i18next"
import type { UnitId } from "@workspace/game-domain"
import type { CharacterStorageModel } from "@workspace/game-catalog"

import { filterableCharacter } from "@/features/unit-filters"
import type { FilterableUnit } from "@/features/unit-filters"
import { useUnitSearchNames } from "@/shared/unit-name"

import { orderUnits } from "../unit/unit-list.model"
import type { UnitListItem } from "../unit/unit-list.model"

/** Every catalog character with its localized name, in the characters list's default order. */
export function useCharacterListItems(
  characters: readonly CharacterStorageModel[]
): UnitListItem[] {
  const searchNamesOf = useUnitSearchNames()
  const { t, i18n } = useTranslation(["characters", "factions"])
  return useMemo(
    () =>
      orderUnits(
        characters.map((character) => ({
          id: character.id,
          name: t(`characters:${character.id}`, {
            defaultValue: character.name,
          }),
          factionId: character.faction,
          factionName: t(`factions:${character.faction}`, {
            defaultValue: character.faction,
          }),
          alliance: character.alliance,
          searchNames: searchNamesOf(character.id),
        })),
        i18n.language
      ),
    [characters, t, searchNamesOf, i18n.language]
  )
}

/** What the unit filters read of each catalog character, by id. */
export function useFilterableCharacters(
  characters: readonly CharacterStorageModel[]
): (id: UnitId) => FilterableUnit | undefined {
  return useMemo(() => {
    const byId = new Map(
      characters.map((character) => [
        character.id,
        filterableCharacter(character),
      ])
    )
    return (id) => byId.get(id)
  }, [characters])
}
