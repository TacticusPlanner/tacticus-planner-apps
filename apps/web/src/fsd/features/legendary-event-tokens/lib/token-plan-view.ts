import {
  LEGENDARY_EVENT_LANE_IDS,
  applicableAnnotations,
  buildLanePointsModel,
  teamDepthForRun,
  teamEffectiveDepth,
  type ClearEstimate,
  type LegendaryEvent,
  type LegendaryEventLaneId,
  type LegendaryEventLifecycle,
  type LegendaryEventPlan,
  type LegendaryEventProgress,
  type LegendaryEventRun,
} from "@/entities/legendary-event"

import {
  fewestTokensForFullClear,
  type FullClearFigure,
} from "./minimum-tokens"
import { forecastRuns, type Forecast } from "./run-forecast"
import {
  nextToken,
  planTokens,
  type NextTokenChoice,
  type TokenPlan,
  type TokenPlanLane,
} from "./token-plan"
import { runTokenSupply } from "./token-supply"

/** A lane's team estimator, as the page builds it from the Stage 5 clear estimates. */
type LaneTeamEstimator = {
  team: (
    memberUnitIds: readonly string[]
  ) => Pick<ClearEstimate, "depth"> | null
}

/** The clear estimates the depth fallback reads (design D8): `hidden` degrades to manual depths. */
type TokenPlanEstimates =
  | { kind: "hidden" }
  | { kind: "pending" }
  | { kind: "ready"; byLane: Record<LegendaryEventLaneId, LaneTeamEstimator> }

export interface TokenPlanViewInput {
  event: Pick<LegendaryEvent, "alpha" | "beta" | "gamma" | "rewards">
  lifecycle: LegendaryEventLifecycle
  nowMs: number
  /** The event's synced entry, `undefined` without one, or the read's pending / failed status. */
  progress: LegendaryEventProgress | undefined | "loading" | "error"
  progressObservedAtMs: number | null
  plan: {
    enabled: boolean
    status: "pending" | "error" | "success"
    data: LegendaryEventPlan | undefined
  }
  /** The run depths are read for (`currentLegendaryEventRun`). */
  run: LegendaryEventRun
  estimates: TokenPlanEstimates
}

/** Why there is no next token (spec: Next token card), checked in this order. */
export type NextTokenEmpty =
  | { kind: "allCleared" }
  | { kind: "noTeams"; laneId: LegendaryEventLaneId }
  | {
      kind: "noDepth"
      laneId: LegendaryEventLaneId
      teamId: string
      teamName: string
    }
  | { kind: "nothingLeft"; laneId: LegendaryEventLaneId; points: number }

export interface LaneFullClear {
  laneId: LegendaryEventLaneId
  figure: FullClearFigure
}

export interface TokenPlanReady {
  kind: "ready"
  plan: TokenPlan
  next: NextTokenChoice | null
  empty: NextTokenEmpty | null
  /** Non-reserve members by team id, for the card's portraits. */
  membersByTeam: ReadonlyMap<string, readonly string[]>
  /** One per lane with a team that has a depth, in lane order. */
  fullClear: LaneFullClear[]
  /** Null when the event's reward ladder is missing (a record cached before rewards were served). */
  forecast: Forecast | null
  /** The run an upcoming event starts next; null when the event is active. */
  upcomingRun: LegendaryEventRun | null
  /** Tokens left over across runs while the plan is shorter than the supply, with the first lane
   *  that still has points left; null when every token has a battle to play. */
  leftover: { tokens: number; laneId: LegendaryEventLaneId | null } | null
}

/** The Overview's token sections by data state (design D8). Signed out there is no plan to read, so
 *  nothing renders (as with the Teams section). */
export type TokenPlanView =
  | { kind: "hidden" }
  | { kind: "loading" }
  | { kind: "unavailable" }
  | { kind: "planError" }
  | TokenPlanReady

/**
 * The token plan, next token, fewest tokens, supply and forecast from the page's reads (design D2,
 * D4, D6, D8). Depths are the current run's stored depth, else the Stage 5 estimate.
 */
export function buildTokenPlanView(input: TokenPlanViewInput): TokenPlanView {
  const { event, lifecycle, progress, plan, run, estimates } = input
  if (lifecycle.state === "archived" || !plan.enabled) return { kind: "hidden" }
  if (progress === "error") return { kind: "unavailable" }
  if (plan.status === "error") return { kind: "planError" }
  if (progress === "loading" || !plan.data || estimates.kind === "pending") {
    return { kind: "loading" }
  }
  const entry = progress
  const teams = [...plan.data.teams].sort((a, b) => a.sortOrder - b.sortOrder)

  const lanes = LEGENDARY_EVENT_LANE_IDS.map((laneId): TokenPlanLane => {
    const synced = entry ? entry[laneId] : undefined
    const estimator =
      estimates.kind === "ready" ? estimates.byLane[laneId] : undefined
    return {
      laneId,
      model: buildLanePointsModel(event[laneId]),
      synced,
      teams: teams
        .filter((team) => team.laneId === laneId)
        .map((team) => ({
          id: team.id,
          name: team.name,
          objectiveIndexes: team.objectiveIndexes,
          depth: teamEffectiveDepth(
            teamDepthForRun(team, run)?.expectedBattleClears ?? null,
            estimator?.team(team.memberUnitIds) ?? null
          ),
        })),
      annotations: applicableAnnotations(
        plan.data!.annotations,
        laneId,
        synced
      ),
    }
  })

  const tokenPlan = planTokens({
    lanes,
    startingPoints: entry?.currentPoints ?? 0,
  })
  const supply = runTokenSupply({
    lifecycle,
    progress: entry,
    progressObservedAtMs: input.progressObservedAtMs,
    nowMs: input.nowMs,
    runs: plan.data.runs,
    showPaidOptions: plan.data.showPaidOptions,
  })
  const forecast =
    supply && event.rewards
      ? forecastRuns({
          rewards: event.rewards,
          progress: entry,
          supply,
          tokens: tokenPlan.tokens,
          runs: plan.data.runs,
          showPaidOptions: plan.data.showPaidOptions,
        })
      : null

  const firstLaneWithPoints =
    tokenPlan.lanes.find((lane) => lane.pointsLeftAfterPlan > 0)?.laneId ?? null
  const tokensLeftOver = forecast
    ? forecast.runs.reduce((sum, entry) => sum + entry.tokensLeftOver, 0)
    : 0

  return {
    kind: "ready",
    plan: tokenPlan,
    next: nextToken(tokenPlan),
    empty: tokenPlan.tokens.length > 0 ? null : emptyReason(tokenPlan, lanes),
    membersByTeam: new Map(teams.map((team) => [team.id, team.memberUnitIds])),
    fullClear: lanes.flatMap((lane) => {
      const figure = fewestTokensForFullClear(
        lane.teams,
        lane.model.objectives.length
      )
      return figure ? [{ laneId: lane.laneId, figure }] : []
    }),
    forecast,
    upcomingRun:
      lifecycle.state === "upcoming"
        ? (supply?.find((entry) => entry.state === "next")?.run ?? null)
        : null,
    leftover:
      tokensLeftOver > 0
        ? { tokens: tokensLeftOver, laneId: firstLaneWithPoints }
        : null,
  }
}

function emptyReason(
  plan: TokenPlan,
  lanes: readonly TokenPlanLane[]
): NextTokenEmpty {
  if (plan.lanes.every((lane) => lane.completeInSync)) {
    return { kind: "allCleared" }
  }
  const withPoints = plan.lanes.filter((lane) => lane.pointsLeftAfterPlan > 0)
  if (lanes.every((lane) => lane.teams.length === 0)) {
    return {
      kind: "noTeams",
      laneId: withPoints[0]?.laneId ?? LEGENDARY_EVENT_LANE_IDS[0]!,
    }
  }
  if (lanes.every((lane) => lane.teams.every((team) => !team.depth))) {
    for (const lane of lanes) {
      const team = lane.teams[0]
      if (team) {
        return {
          kind: "noDepth",
          laneId: lane.laneId,
          teamId: team.id,
          teamName: team.name,
        }
      }
    }
  }
  const most = withPoints.reduce<(typeof withPoints)[number] | undefined>(
    (best, lane) =>
      !best || lane.pointsLeftAfterPlan > best.pointsLeftAfterPlan
        ? lane
        : best,
    undefined
  )
  return {
    kind: "nothingLeft",
    laneId: most?.laneId ?? LEGENDARY_EVENT_LANE_IDS[0]!,
    points: most?.pointsLeftAfterPlan ?? 0,
  }
}

/** The Next token card's state for analytics (design D9); null while nothing settled renders. */
export type NextTokenCardState =
  "token" | "noTeams" | "noDepth" | "nothingLeft" | "allCleared" | "unavailable"

export function nextTokenCardState(
  view: TokenPlanView
): NextTokenCardState | null {
  if (view.kind === "unavailable") return "unavailable"
  if (view.kind !== "ready") return null
  return view.next ? "token" : (view.empty?.kind ?? null)
}
