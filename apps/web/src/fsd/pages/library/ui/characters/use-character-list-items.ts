import { useMemo } from "react"
import { useTranslation } from "react-i18next"
import type { CharacterStorageModel } from "@workspace/game-catalog"

import {
  orderCharacters,
  type CharacterListItem,
} from "./characters-list.view-model"

/** Every catalog character with its localized name, in the characters list's default order. */
export function useCharacterListItems(
  characters: readonly CharacterStorageModel[]
): CharacterListItem[] {
  const { t, i18n } = useTranslation(["characters", "factions"])
  return useMemo(
    () =>
      orderCharacters(
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
        })),
        i18n.language
      ),
    [characters, t, i18n.language]
  )
}
