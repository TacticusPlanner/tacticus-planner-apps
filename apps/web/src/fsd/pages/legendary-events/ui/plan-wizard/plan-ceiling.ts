import {
  ASCENSION_STEPS,
  projectRewards,
  unitNextAscensionStep,
  type AscensionStep,
  type LegendaryEventPlan,
  type LegendaryEventRun,
  type LegendaryEventTeam,
} from "@/entities/legendary-event"
import {
  buildTokenPlanView,
  type TokenPlanMissionsSource,
  type TokenPlanView,
} from "@/features/legendary-event-tokens"

import type { PlanEconomy, PlanInputs } from "./plan-inputs"
import type { DraftTeam } from "./plan-teams"

/** The draft as a plan the token plan and forecast read: every team with a depth per plan run. */
function draftPlan(
  inputs: Pick<PlanInputs, "plan">,
  teams: readonly DraftTeam[],
  economy: PlanEconomy
): LegendaryEventPlan {
  const order = new Map<string, number>()
  return {
    ...inputs.plan,
    showPaidOptions: economy.showPaidOptions,
    runs: [...economy.runs],
    teams: teams.map((team): LegendaryEventTeam => {
      const sortOrder = order.get(team.laneId) ?? 0
      order.set(team.laneId, sortOrder + 1)
      return {
        id: team.key,
        laneId: team.laneId,
        name: team.name,
        sortOrder,
        memberUnitIds: team.memberUnitIds,
        reserveUnitId: team.reserveUnitId,
        objectiveIndexes: team.objectiveIndexes,
        runDepths: Object.entries(team.depthByRun).map(([run, depth]) => ({
          run: Number(run) as LegendaryEventRun,
          expectedBattleClears: depth ?? 0,
          expectedBattleClearsSource: "estimate",
          recordedAt: "",
        })),
      }
    }),
  }
}

/** The token plan, supply and forecast of the draft, each token at its run's depth; with
 *  `missions`, also its Missions order. */
export function draftTokenView(
  inputs: PlanInputs,
  teams: readonly DraftTeam[],
  economy: PlanEconomy,
  teamName?: (team: LegendaryEventTeam) => string,
  missions?: TokenPlanMissionsSource
): TokenPlanView {
  return buildTokenPlanView({
    event: inputs.event,
    lifecycle: inputs.lifecycle,
    nowMs: inputs.nowMs,
    progress: inputs.progress,
    progressObservedAtMs: inputs.progressObservedAtMs,
    plan: {
      enabled: true,
      status: "success",
      data: draftPlan(inputs, teams, economy),
    },
    resolution: inputs.resolution,
    eventUnit: inputs.eventUnit,
    // Every draft team carries a depth per run, so no live estimate is read.
    estimates: { kind: "hidden" },
    teamName,
    missions,
    perRunDepths: true,
  })
}

/** The ceiling (spec: ceiling and verdict per step): the forecast ending points of the horizon
 *  run, or of the last run without one. */
export function ceilingOf(
  view: TokenPlanView,
  horizon?: LegendaryEventRun
): number | null {
  if (view.kind !== "ready" || !view.forecast) return null
  const { runs } = view.forecast
  const atHorizon =
    horizon === undefined
      ? undefined
      : (runs.findLast((entry) => entry.run <= horizon) ?? runs[0])
  return (atHorizon ?? runs.at(-1))?.endingPoints ?? null
}

/** A step's points target: the points to end the horizon run on, or not reachable by then. */
export type StepTarget =
  | { step: AscensionStep; kind: "points"; points: number }
  | { step: AscensionStep; kind: "unreachable" }

/**
 * The points target of every step after the unit's synced progression (spec: points target for a
 * chosen ascension step) by the end of the horizon run, through the projection with that step in
 * place of the next one and only the runs through the horizon. A step the held shards already
 * cover is not offered; enough currency now targets the current points.
 */
export function stepTargets(
  inputs: Pick<PlanInputs, "event" | "progress" | "resolution" | "eventUnit">,
  economy: PlanEconomy,
  horizon?: LegendaryEventRun
): StepTarget[] {
  const rewards = inputs.event.rewards as
    PlanInputs["event"]["rewards"] | undefined
  if (!rewards) return []
  const from = unitNextAscensionStep(inputs.eventUnit)
  if (from === "fullyAscended") return []
  return ASCENSION_STEPS.slice(ASCENSION_STEPS.indexOf(from)).flatMap(
    (step): StepTarget[] => {
      const projection = projectRewards({
        rewards,
        progress: inputs.progress,
        resolution: inputs.resolution,
        unit: inputs.eventUnit,
        runs: economy.runs,
        showPaidOptions: economy.showPaidOptions,
        targetStep: step,
        ...(horizon === undefined ? {} : { throughRun: horizon }),
      })
      if (projection.goal.step === "fullyAscended") return []
      const points = projection.points
      if (!points || points.state === "beyondPointsLadder") {
        return [{ step, kind: "unreachable" }]
      }
      return [
        {
          step,
          kind: "points",
          points:
            points.state === "affordableNow"
              ? projection.base.points
              : points.cumulativePoints,
        },
      ]
    }
  )
}

export type StepVerdict =
  | { kind: "reachableNow"; spare: number }
  | { kind: "needsUpgrades"; short: number }
  | { kind: "tooAmbitious"; short: number | null }

/** A step's verdict from the synced and the fully upgraded ceilings. */
export function stepVerdict(
  target: StepTarget,
  syncedCeiling: number,
  upgradedCeiling: number
): StepVerdict {
  if (target.kind === "unreachable") {
    return { kind: "tooAmbitious", short: null }
  }
  if (target.points <= syncedCeiling) {
    return { kind: "reachableNow", spare: syncedCeiling - target.points }
  }
  const short = target.points - syncedCeiling
  return target.points <= upgradedCeiling
    ? { kind: "needsUpgrades", short }
    : { kind: "tooAmbitious", short }
}

/** The highest step whose verdict is not Too ambitious, or null. */
export function bestStepWithinReach(
  verdicts: readonly { step: AscensionStep; verdict: StepVerdict }[]
): AscensionStep | null {
  return (
    verdicts.findLast((entry) => entry.verdict.kind !== "tooAmbitious")?.step ??
    null
  )
}
