import { useMemo, useState } from "react"

import type { LegendaryEventUnit } from "@/entities/legendary-event"

import {
  DEFAULT_SUGGESTION_TOGGLES,
  buildTeamSuggestionsState,
  type TeamSuggestionsSource,
  type TeamSuggestionsToggles,
} from "./team-suggestions-state"

/** The dialog lists at most this many proposals (after Show more). */
export const MAX_SUGGESTIONS_SHOWN = 10

/** The lane's proposals for `toggles`, memoised on the source's fields. */
function useTeamSuggestionsState(
  source: TeamSuggestionsSource,
  toggles: TeamSuggestionsToggles,
  nameOf: (unit: LegendaryEventUnit) => string
) {
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
  return state
}

/** Memoised suggestions with the dialog's two toggles; mount per opening so the toggles reset. */
export function useTeamSuggestions(
  source: TeamSuggestionsSource,
  nameOf: (unit: LegendaryEventUnit) => string
) {
  const [toggles, setToggles] = useState<TeamSuggestionsToggles>(
    DEFAULT_SUGGESTION_TOGGLES
  )
  const state = useTeamSuggestionsState(source, toggles, nameOf)
  return {
    state,
    toggles,
    setOnlyUnlocked: (onlyUnlocked: boolean) =>
      setToggles((current) => ({ ...current, onlyUnlocked })),
    setPreferGoals: (preferGoals: boolean) =>
      setToggles((current) => ({ ...current, preferGoals })),
  }
}

/**
 * How many proposals the dialog opens with (its default toggles), capped at what it can list, for
 * the Suggest teams button's count; null while the estimates load or when they are unavailable.
 */
export function useTeamSuggestionCount(
  source: TeamSuggestionsSource,
  nameOf: (unit: LegendaryEventUnit) => string
): number | null {
  const state = useTeamSuggestionsState(
    source,
    DEFAULT_SUGGESTION_TOGGLES,
    nameOf
  )
  return state.kind === "ready"
    ? Math.min(state.suggestions.length, MAX_SUGGESTIONS_SHOWN)
    : null
}
