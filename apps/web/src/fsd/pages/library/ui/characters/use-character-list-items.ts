import { useMemo } from "react"
import { useTranslation } from "react-i18next"
import type { CharacterStorageModel } from "@workspace/game-catalog"

import { useUnitSearchNames } from "@/shared/unit-name"

import { orderUnits, type UnitListItem } from "../unit/unit-list.model"

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
