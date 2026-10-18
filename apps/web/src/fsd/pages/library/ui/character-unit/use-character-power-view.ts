import type { ReadState } from "@/shared/lib"
import { useUnitPowerContext, type UnitPowerContext } from "@/shared/unit-power"

import {
  characterPowerValues,
  characterPowerView,
  type CharacterPowerView,
  type PlayerCharacter,
  type ShownValues,
} from "./character-unit.view-model"

const LOADING: ReadState<UnitPowerContext | null> = {
  status: "loading",
  retry: () => {},
}

/**
 * The character page's stats (At a glance, Stats by rank) and header power at the shown values and
 * panel levels (design D6), both from one set of values so they never disagree. Recomputed as soon
 * as any input changes; never stored. While the player record is still read (`playerLoading`) the
 * shown values are the starting ones, so the figures stay loading rather than show those.
 *
 * Also returns the page's one power context read, for the Rank-up materials tab.
 */
export function useCharacterPowerView({
  characterId,
  shown,
  player,
  playerLoading,
  activeLevel,
  passiveLevel,
  equippedRelic,
}: {
  characterId: string
  shown: ShownValues
  player: PlayerCharacter | undefined
  playerLoading: boolean
  activeLevel: number
  passiveLevel: number
  equippedRelic?: { id: string; level: number }
}): { view: CharacterPowerView; unitPower: UnitPowerContext | null } {
  const context = useUnitPowerContext()
  // Cheap (one stat step per ladder rank), so it is recomputed on every render.
  const view = characterPowerView(
    characterId,
    characterPowerValues({
      shown,
      player,
      activeLevel,
      passiveLevel,
      equippedRelic,
    }),
    playerLoading ? LOADING : context
  )
  return {
    view,
    unitPower: context.status === "ready" ? context.data : null,
  }
}
