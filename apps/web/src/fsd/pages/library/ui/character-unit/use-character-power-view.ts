import { useUnitPowerContext } from "@/shared/unit-power"

import {
  characterPowerValues,
  characterPowerView,
  type CharacterPowerView,
  type PlayerCharacter,
  type ShownValues,
} from "./character-unit.view-model"

/**
 * The character page's stats (At a glance, Stats by rank) and header power at the shown values and
 * panel levels (design D6), both from one set of values so they never disagree. Recomputed as soon
 * as any input changes; never stored.
 */
export function useCharacterPowerView({
  characterId,
  shown,
  player,
  activeLevel,
  passiveLevel,
  equippedRelic,
}: {
  characterId: string
  shown: ShownValues
  player: PlayerCharacter | undefined
  activeLevel: number
  passiveLevel: number
  equippedRelic?: { id: string; level: number }
}): CharacterPowerView {
  const context = useUnitPowerContext()
  // Cheap (one stat step per ladder rank), so it is recomputed on every render.
  return characterPowerView(
    characterId,
    characterPowerValues({
      shown,
      player,
      activeLevel,
      passiveLevel,
      equippedRelic,
    }),
    context
  )
}
