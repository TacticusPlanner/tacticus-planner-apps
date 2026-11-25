import { useMemo } from "react"

import { useTeamRoster } from "@/entities/team"
import type { TeamRoster } from "@/entities/team"
import { combineReadStates } from "@/shared/lib"
import { useCatalogDataset } from "@/shared/local-data"
import { useUnitName, useUnitSearchNames } from "@/shared/unit-name"

import { buildPickerUnits } from "./unit-picker"
import type { PickerUnit } from "./unit-picker"

/**
 * The roster and every unit the picker can list, for a page that picks units outside the editor
 * (Guild War Offense). Built once per loaded dataset set, as in the editor.
 */
export function usePickerUnits() {
  const roster = useTeamRoster()
  const characters = useCatalogDataset("characters")
  const mows = useCatalogDataset("mows")
  const unitName = useUnitName()
  const searchNamesOf = useUnitSearchNames()
  const combined = combineReadStates(roster, characters, mows)
  const [readyRoster, readyCharacters, readyMows] =
    combined.status === "ready" ? combined.data : []

  const data = useMemo(():
    { roster: TeamRoster | null; units: PickerUnit[] } | undefined => {
    if (
      readyRoster === undefined ||
      readyCharacters === undefined ||
      readyMows === undefined
    ) {
      return undefined
    }
    return {
      roster: readyRoster,
      units: buildPickerUnits({
        characters: readyCharacters,
        mows: readyMows,
        roster: readyRoster,
        nameOf: (kind, id) =>
          unitName(kind === "mow" ? "Mow" : "Character", id),
        searchNamesOf,
      }),
    }
  }, [readyRoster, readyCharacters, readyMows, unitName, searchNamesOf])

  if (!data) {
    return combined.status === "error"
      ? ({ status: "error", retry: combined.retry } as const)
      : ({ status: "loading", retry: combined.retry } as const)
  }
  return { status: "ready", data, retry: combined.retry } as const
}
