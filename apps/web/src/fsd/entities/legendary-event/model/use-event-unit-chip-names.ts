import { useCallback } from "react"

import { useUnitName, useUnitSearchNames } from "@/shared/unit-name"

export interface EventUnitChipNames {
  /** What the chip's name line shows: the game's extra-short name ("Helbrecht"). */
  displayName: string
  /** What the details and the accessible name use: the unit's first other name in the current
   *  language when it differs ("High Marshal Helbrecht"), else the display name. */
  longName: string
}

/** The chip's names for a Character id; referentially stable while the language is unchanged. */
export function useEventUnitChipNames() {
  const unitName = useUnitName()
  const otherNames = useUnitSearchNames()
  return useCallback(
    (unitId: string): EventUnitChipNames => {
      const displayName = unitName("Character", unitId)
      const first = otherNames(unitId)[0]
      return {
        displayName,
        longName: first && first !== displayName ? first : displayName,
      }
    },
    [unitName, otherNames]
  )
}
