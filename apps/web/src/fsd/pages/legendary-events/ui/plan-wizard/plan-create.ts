import {
  runInputValues,
  type LegendaryEventLaneId,
  type LegendaryEventPlan,
  type LegendaryEventRun,
  type LegendaryEventRunInputValues,
} from "@/entities/legendary-event"

import type { UnitGoalChain } from "./plan-draft"
import type { PlanEconomy } from "./plan-inputs"
import type { DraftTeam } from "./plan-teams"

/** Where the goals go (spec: creation files goals in a project targeting the event). */
export type PlanDestination =
  { kind: "existing"; projectId: string } | { kind: "new"; name: string }

/** One lane's team writes: removals of stored teams, updates of edited ones, then new teams. */
interface LaneTeamWrites {
  laneId: LegendaryEventLaneId
  remove: string[]
  /** Stored teams the user edited, sent as updates (never a removal and a creation). */
  update: DraftTeam[]
  create: DraftTeam[]
}

export interface PlanWrites {
  goals: UnitGoalChain[]
  lanes: LaneTeamWrites[]
  runs: { run: LegendaryEventRun; values: LegendaryEventRunInputValues }[]
  showPaidOptions: boolean | null
}

const sameValues = (
  a: LegendaryEventRunInputValues,
  b: LegendaryEventRunInputValues
) =>
  a.regularMissions === b.regularMissions &&
  a.premiumMissions === b.premiumMissions &&
  a.bundlePurchased === b.bundlePurchased &&
  a.closeShards === b.closeShards &&
  a.completedRegularMissions.join() === b.completedRegularMissions.join() &&
  a.completedPremiumMissions.join() === b.completedPremiumMissions.join()

/** What Create writes: the goals not already planned, each lane's removed, edited and new teams,
 *  and the edited runs. Stored teams kept as they are cause no write. */
export function planWrites({
  plan,
  teams,
  chains,
  runs,
  economy,
}: {
  plan: LegendaryEventPlan
  teams: readonly DraftTeam[]
  chains: readonly UnitGoalChain[]
  runs: readonly LegendaryEventRun[]
  economy: PlanEconomy
}): PlanWrites {
  const kept = new Set(teams.flatMap((team) => team.storedId ?? []))
  const lanes = (["alpha", "beta", "gamma"] as const)
    .map((laneId) => ({
      laneId,
      remove: plan.teams
        .filter((team) => team.laneId === laneId)
        .filter((team) => team.memberUnitIds.length >= 3)
        .filter((team) => !kept.has(team.id))
        .map((team) => team.id),
      update: teams.filter(
        (team) =>
          team.laneId === laneId && team.storedId !== null && team.edited
      ),
      create: teams.filter(
        (team) => team.laneId === laneId && team.storedId === null
      ),
    }))
    .filter(
      (lane) =>
        lane.remove.length > 0 ||
        lane.update.length > 0 ||
        lane.create.length > 0
    )
  return {
    goals: chains.filter((chain) => !chain.alreadyPlanned),
    lanes,
    runs: runs.flatMap((run) => {
      const values = runInputValues(economy.runs, run)
      return sameValues(values, runInputValues(plan.runs, run))
        ? []
        : [{ run, values }]
    }),
    showPaidOptions:
      economy.showPaidOptions === plan.showPaidOptions
        ? null
        : economy.showPaidOptions,
  }
}

/** The counts the Create label and the toast carry. */
export function writeCounts(writes: PlanWrites) {
  return {
    goals: writes.goals.length,
    teams: writes.lanes.reduce(
      (sum, lane) => sum + lane.create.length + lane.update.length,
      0
    ),
    runs: writes.runs.length > 0 || writes.showPaidOptions !== null,
  }
}
