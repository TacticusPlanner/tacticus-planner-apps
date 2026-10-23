import { useMemo, useState } from "react"

import type { LegendaryEventUnit } from "@/entities/legendary-event"

import {
  DEFAULT_SUGGESTION_TOGGLES,
  buildTeamSuggestionsState,
  type TeamSuggestionsSource,
  type TeamSuggestionsToggles,
} from "./team-suggestions-state"

/** Memoised suggestions with the dialog's two toggles; mount per opening so the toggles reset. */
export function useTeamSuggestions(
  source: TeamSuggestionsSource,
  nameOf: (unit: LegendaryEventUnit) => string
) {
  const [toggles, setToggles] = useState<TeamSuggestionsToggles>(
    DEFAULT_SUGGESTION_TOGGLES
  )
  // The page passes `source` inline, so the memo keys on its fields (each a memoised read).
  const {
    eventId,
    laneId,
    lane,
    units,
    teams,
    run,
    model,
    progress,
    estimates,
    goalUnitIds,
  } = source
  const state = useMemo(
    () =>
      buildTeamSuggestionsState(
        {
          eventId,
          laneId,
          lane,
          units,
          teams,
          run,
          model,
          progress,
          estimates,
          goalUnitIds,
        },
        toggles,
        nameOf
      ),
    [
      eventId,
      laneId,
      lane,
      units,
      teams,
      run,
      model,
      progress,
      estimates,
      goalUnitIds,
      toggles,
      nameOf,
    ]
  )
  return {
    state,
    toggles,
    setOnlyUnlocked: (onlyUnlocked: boolean) =>
      setToggles((current) => ({ ...current, onlyUnlocked })),
    setPreferGoals: (preferGoals: boolean) =>
      setToggles((current) => ({ ...current, preferGoals })),
  }
}
