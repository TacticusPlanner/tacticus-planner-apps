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
  const state = useMemo(
    () => buildTeamSuggestionsState(source, toggles, nameOf),
    // `nameOf` reads the settled catalog; the source fields are the page's memoised reads.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      source.lane,
      source.units,
      source.teams,
      source.run,
      source.model,
      source.progress,
      source.estimates,
      source.goalUnitIds,
      toggles,
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
