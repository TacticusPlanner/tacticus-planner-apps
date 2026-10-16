import type { Rarity } from "@workspace/game-domain"

import {
  impactTeams,
  isCompleteTeam,
  laneUpgradeImpact,
  type LaneEstimateInputs,
  type LanePointsModel,
  type LaneProgressView,
  type LegendaryEventLane,
  type LegendaryEventRun,
  type LegendaryEventTeam,
  type LegendaryEventUnit,
  type UpgradeImpact,
} from "@/entities/legendary-event"

/** The Upgrade impact section's body by data state (design D8). */
export type UpgradeImpactState =
  | { kind: "loading" }
  | { kind: "noTeams" }
  | { kind: "needsEstimates" }
  | { kind: "ready"; impact: UpgradeImpact }

/**
 * One lane's Upgrade impact from the plan's teams on the lane and its clear-estimate inputs: a
 * skeleton while either loads, "Add a team" without teams (an incomplete team, below three
 * members, does not count), "Needs clear estimates" when the estimates are unavailable (tier list
 * or battles failed, roster unknown), else the rows.
 */
export function buildUpgradeImpactState({
  teams,
  estimates,
  lane,
  units,
  run,
  model,
  progress,
  initialRarityOf,
  nameOf,
}: {
  /** The lane's teams, or "loading" while the plan, units or progress load. */
  teams: readonly LegendaryEventTeam[] | "loading"
  /** The lane's estimate inputs; undefined when estimates are unavailable. */
  estimates: LaneEstimateInputs | "pending" | undefined
  lane: Pick<LegendaryEventLane, "allowedUnitsFilter" | "unitsRestrictions">
  units: readonly LegendaryEventUnit[]
  run: LegendaryEventRun
  model: LanePointsModel
  progress: LaneProgressView | undefined
  initialRarityOf: (unitId: string) => Rarity | undefined
  nameOf: (unitId: string) => string
}): UpgradeImpactState {
  if (teams === "loading" || estimates === "pending") return { kind: "loading" }
  if (!teams.some(isCompleteTeam)) return { kind: "noTeams" }
  if (!estimates) return { kind: "needsEstimates" }
  return {
    kind: "ready",
    impact: laneUpgradeImpact({
      model,
      progress,
      teams: impactTeams(teams, lane, units, run),
      battlePowers: estimates.battlePowers,
      roster: estimates.roster,
      config: estimates.config,
      initialRarityOf,
      nameOf,
    }),
  }
}
