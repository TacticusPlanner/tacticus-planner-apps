import {
  impactTeams,
  suggestLaneTeams,
  teamReaches,
  type LaneEstimateInputs,
  type LanePointsModel,
  type LaneProgressView,
  type LegendaryEventLane,
  type LegendaryEventLaneId,
  type LegendaryEventRun,
  type LegendaryEventTeam,
  type LegendaryEventUnit,
  type TeamSuggestion,
} from "@/entities/legendary-event"

/** Everything one lane's suggestions read, from the page (synced roster, never Goals Preview). */
export interface TeamSuggestionsSource {
  eventId: string
  laneId: LegendaryEventLaneId
  lane: LegendaryEventLane
  units: readonly LegendaryEventUnit[]
  /** The lane's saved teams. */
  teams: readonly LegendaryEventTeam[]
  run: LegendaryEventRun
  model: LanePointsModel
  progress: LaneProgressView | undefined
  /** The lane's estimate inputs; "pending" while they load, undefined when unavailable. */
  estimates: LaneEstimateInputs | "pending" | undefined
  /** Units with an Active goal (for Prefer units with goals). */
  goalUnitIds: ReadonlySet<string>
}

export interface TeamSuggestionsToggles {
  onlyUnlocked: boolean
  preferGoals: boolean
}

export const DEFAULT_SUGGESTION_TOGGLES: TeamSuggestionsToggles = {
  onlyUnlocked: true,
  preferGoals: false,
}

export type TeamSuggestionsState =
  | { kind: "loading" }
  | { kind: "needsEstimates" }
  | { kind: "ready"; suggestions: TeamSuggestion[] }

/** The lane's proposals by data state (spec: team suggestions per lane, design D6, D8). */
export function buildTeamSuggestionsState(
  source: TeamSuggestionsSource,
  toggles: TeamSuggestionsToggles,
  nameOf: (unit: LegendaryEventUnit) => string
): TeamSuggestionsState {
  const { estimates } = source
  if (estimates === "pending") return { kind: "loading" }
  if (!estimates) return { kind: "needsEstimates" }
  const existingTeams = teamReaches(
    impactTeams(source.teams, source.lane, source.units, source.run),
    estimates
  )
  return {
    kind: "ready",
    suggestions: suggestLaneTeams({
      lane: source.lane,
      units: source.units,
      model: source.model,
      progress: source.progress,
      existingTeams,
      battlePowers: estimates.battlePowers,
      roster: estimates.roster,
      config: estimates.config,
      onlyUnlocked: toggles.onlyUnlocked,
      preferGoals: toggles.preferGoals,
      goalUnitIds: source.goalUnitIds,
      nameOf,
    }),
  }
}
