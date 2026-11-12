import {
  LEGENDARY_EVENT_LANE_IDS,
  applicableAnnotations,
  buildLanePointsModel,
  completedMissions,
  currentLegendaryEventRun,
  isCompleteTeam,
  openMissions,
  teamDepthForRun,
  teamEffectiveDepth,
  unitNextAscensionStep,
  type ClearEstimate,
  type LegendaryEvent,
  type LegendaryEventLaneId,
  type LegendaryEventLifecycle,
  type LegendaryEventPlan,
  type LegendaryEventProgress,
  type LegendaryEventRosterUnit,
  type LegendaryEventRun,
  type LegendaryEventRunResolution,
  type LegendaryEventTeam,
  type LegendaryEventUnit,
} from "@/entities/legendary-event"

import {
  fewestTokensForFullClear,
  type FullClearFigure,
} from "./minimum-tokens"
import { forecastRuns, type Forecast } from "./run-forecast"
import { milestoneGap, type MilestoneGap } from "./milestone-push"
import {
  nextToken,
  planTokens,
  playableNext,
  type NextTokenChoice,
  type PlannedToken,
  type TokenPlan,
  type RunSlots,
  type TokenPlanLane,
} from "./token-plan"
import { runTokenSupply, type RunSupply } from "./token-supply"
import {
  nextTokenMissions,
  tokenMissionProgress,
  type MissionProgress,
  type NextTokenMissions,
  type TokenMissionsInput,
} from "./token-missions"
import {
  gainsFromProgress,
  gainsFromSteps,
  type MissionGain,
} from "./mission-gains"
import { splitPlanByRun, type PlanByRun } from "./token-runs"
import { missionOrder, type MissionOrder } from "./mission-order"
import type { TokenMarker } from "./run-forecast"

/** A lane's team estimator, as the page builds it from the Stage 5 clear estimates. */
type LaneTeamEstimator = {
  team: (
    memberUnitIds: readonly string[]
  ) =>
    | (Pick<ClearEstimate, "depth"> &
        Partial<Pick<ClearEstimate, "sureDepth" | "stretchDepth">>)
    | null
}

/** The clear estimates the depth fallback reads (design D8): `hidden` degrades to manual depths. */
type TokenPlanEstimates =
  | { kind: "hidden" }
  | { kind: "pending" }
  | { kind: "ready"; byLane: Record<LegendaryEventLaneId, LaneTeamEstimator> }

/** A team's clear depth as the Next token's team popover shows it. */
export interface TeamClearDepth {
  depth: number | null
  /** True when no manual depth is set, so `depth` is the clear estimate. */
  estimated: boolean
  /** The lane's battle count. */
  total: number
  /** The estimate's sure depth when `estimated` (battles 1..sure clear for sure); null with a
   *  manual depth or an estimate without bands. */
  sureDepth: number | null
}

/** How sure the estimate is that a team clears a battle: `sure` within its sure depth, `likely`
 *  past it (within the headline depth); null for a manual depth or an estimate without bands. */
export type TokenClearBand = "sure" | "likely"

/** The band of the estimate a token's battle (0-based `battleIndex`) falls in. */
export function tokenClearBand(
  depth: TeamClearDepth | undefined,
  battleIndex: number
): TokenClearBand | null {
  if (!depth?.estimated || depth.sureDepth === null) return null
  return battleIndex < depth.sureDepth ? "sure" : "likely"
}

/** What matching tokens with missions reads; without it the card shows no mission lines. */
export interface TokenPlanMissionsSource {
  event: Pick<LegendaryEvent, "regularMissions" | "premiumMissions">
  unitsById: ReadonlyMap<string, LegendaryEventUnit>
  enemiesOf: TokenMissionsInput["enemiesOf"]
}

export interface TokenPlanViewInput {
  event: Pick<
    LegendaryEvent,
    "alpha" | "beta" | "gamma" | "rewards" | "tokens" | "ohSoCloseOffer"
  >
  lifecycle: LegendaryEventLifecycle
  nowMs: number
  /** The event's synced entry, `undefined` without one, or the read's pending / failed status. */
  progress: LegendaryEventProgress | undefined | "loading" | "error"
  progressObservedAtMs: number | null
  /** The account's Watch daily ads setting; false plans no ad tokens (default true). */
  watchAds?: boolean
  plan: {
    enabled: boolean
    status: "pending" | "error" | "success"
    data: LegendaryEventPlan | undefined
  }
  /** The event's resolved runs: the token supply's run states and the run depths are read for
   *  (`currentLegendaryEventRun`). */
  resolution: LegendaryEventRunResolution
  /** The event unit's synced roster record (undefined when not owned): the forecast's steps start
   *  from its next step, as the reward projection's do. */
  eventUnit: Pick<LegendaryEventRosterUnit, "progressionIndex"> | undefined
  estimates: TokenPlanEstimates
  /** The name a team is shown by (its display name); the stored name when absent. */
  teamName?: (team: LegendaryEventTeam) => string
  missions?: TokenPlanMissionsSource
  /** Plan each token with its run's stored depth (the 1-click plan's draft, whose teams carry a
   *  depth per run), instead of the current run's depth for every token. */
  perRunDepths?: boolean
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
  /** The current missions the Next token progresses; null without a next token
   *  or a missions source. */
  missions: NextTokenMissions | null
  empty: NextTokenEmpty | null
  /** Non-reserve members by team id, for the card's portraits. */
  membersByTeam: ReadonlyMap<string, readonly string[]>
  /** Each played team's clear depth for the team popover: the battles it reaches this run (the
   *  manual depth, else the estimate; null with neither), whether that is the estimate, and the
   *  lane's battle count. */
  depthByTeam: ReadonlyMap<string, TeamClearDepth>
  /** One per lane with a team that has a depth, in lane order. */
  fullClear: LaneFullClear[]
  /** Null when the event's reward ladder is missing (a record cached before rewards were served). */
  forecast: Forecast | null
  /** The plan's tokens by run, as the forecast spends them; null without a token supply. */
  byRun: PlanByRun | null
  /** The run an upcoming event starts next (`run` null when the run is unknown); null when the
   *  event is active. */
  upcoming: { run: LegendaryEventRun | null } | null
  /** The Missions order of the plan (spec: Missions order) with its forecast markers; null without
   *  a missions source or a token supply. */
  missionOrder:
    | (MissionOrder & {
        markers: TokenMarker[]
        /** The current missions the order's first playable token progresses (what it adds now). */
        nextProgress: MissionProgress[]
      })
    | null
  /** The current run's shortfall to its next reward step and the left-out battles that could
   *  close it; null when it reaches the step, without a forecast, or in the 1-click plan. */
  milestoneGap: MilestoneGap | null
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
  const { event, lifecycle, progress, plan, resolution, estimates } = input
  const run = currentLegendaryEventRun(resolution)
  // A finished event (every run over, `isLegendaryEventFinished`) reads as archived: no token plan
  // or forecast.
  if (lifecycle.state === "archived" || !plan.enabled) {
    return { kind: "hidden" }
  }
  if (progress === "error") return { kind: "unavailable" }
  if (plan.status === "error") return { kind: "planError" }
  if (progress === "loading" || !plan.data || estimates.kind === "pending") {
    return { kind: "loading" }
  }
  const entry = progress
  // An incomplete team (fewer than three members) is never played: a lane holding only such
  // teams reads as having no team.
  const teams = plan.data.teams
    .filter(isCompleteTeam)
    .sort((a, b) => a.sortOrder - b.sortOrder)

  const estimateByTeam = new Map<
    string,
    ReturnType<LaneTeamEstimator["team"]>
  >()
  const lanes = LEGENDARY_EVENT_LANE_IDS.map((laneId): TokenPlanLane => {
    const synced = entry ? entry[laneId] : undefined
    const estimator =
      estimates.kind === "ready" ? estimates.byLane[laneId] : undefined
    for (const team of teams)
      if (team.laneId === laneId)
        estimateByTeam.set(team.id, estimator?.team(team.memberUnitIds) ?? null)
    return {
      laneId,
      model: buildLanePointsModel(event[laneId]),
      synced,
      teams: teams
        .filter((team) => team.laneId === laneId)
        .map((team) => ({
          id: team.id,
          name: input.teamName?.(team) ?? team.name,
          objectiveIndexes: team.objectiveIndexes,
          depth: teamEffectiveDepth(
            teamDepthForRun(team, run)?.expectedBattleClears ?? null,
            estimateByTeam.get(team.id) ?? null
          ),
          ...(input.perRunDepths
            ? {
                depthByRun: Object.fromEntries(
                  team.runDepths.map((entry) => [
                    entry.run,
                    entry.expectedBattleClears,
                  ])
                ),
              }
            : {}),
        })),
      annotations: applicableAnnotations(
        plan.data!.annotations,
        laneId,
        synced
      ),
    }
  })

  const supply = runTokenSupply({
    bank: event.tokens,
    lifecycle,
    resolution,
    progress: entry,
    progressObservedAtMs: input.progressObservedAtMs,
    nowMs: input.nowMs,
    runs: plan.data.runs,
    showPaidOptions: plan.data.showPaidOptions,
    watchAds: input.watchAds,
  })
  const planInput = {
    lanes,
    startingPoints: entry?.currentPoints ?? 0,
    runSlots: input.perRunDepths && supply ? supplySlots(supply) : undefined,
  }
  const tokenPlan = planTokens(planInput)
  const forecastInput =
    supply && event.rewards
      ? {
          rewards: event.rewards,
          ohSoCloseOffer: event.ohSoCloseOffer,
          progress: entry,
          supply,
          fromStep: unitNextAscensionStep(input.eventUnit),
          runs: plan.data.runs,
          showPaidOptions: plan.data.showPaidOptions,
        }
      : null
  const forecast = forecastInput
    ? forecastRuns({ ...forecastInput, tokens: tokenPlan.tokens })
    : null
  const gap =
    forecastInput && !input.perRunDepths
      ? milestoneGap({
          plan: planInput,
          forecast: forecastInput,
          estimateDepthOf: (teamId) =>
            estimateByTeam.get(teamId)?.depth ?? null,
        })
      : null

  const firstLaneWithPoints =
    tokenPlan.lanes.find((lane) => lane.pointsLeftAfterPlan > 0)?.laneId ?? null
  const tokensLeftOver = forecast
    ? forecast.runs.reduce((sum, entry) => sum + entry.tokensLeftOver, 0)
    : 0

  const next = nextToken(tokenPlan)
  const membersByTeam = new Map(
    teams.map((team) => [team.id, team.memberUnitIds])
  )
  const teamById = new Map(teams.map((team) => [team.id, team]))
  const depthByTeam = new Map(
    lanes.flatMap((lane) =>
      lane.teams.map((team): [string, TeamClearDepth] => {
        const stored = teamById.get(team.id)
        const manual = stored
          ? (teamDepthForRun(stored, run)?.expectedBattleClears ?? null)
          : null
        return [
          team.id,
          {
            depth: team.depth,
            estimated: manual === null,
            total: lane.model.battles.length,
            sureDepth:
              manual === null
                ? (estimateByTeam.get(team.id)?.sureDepth ?? null)
                : null,
          },
        ]
      })
    )
  )
  const source = input.missions
  const membersOf = (teamId: string) =>
    source
      ? (membersByTeam.get(teamId) ?? []).flatMap((id) => {
          const unit = source.unitsById.get(id)
          return unit ? [unit] : []
        })
      : []
  const missionsOf = (run: LegendaryEventRun | null) =>
    source
      ? openMissions({
          event: source.event,
          runs: plan.data!.runs,
          currentRun: run,
          showPaidOptions: plan.data!.showPaidOptions,
        })
      : []
  // Before run 1 (or between runs) the next run's missions are the ones to plan for.
  const missionRun = resolution.currentRun ?? resolution.nextRun
  const missions =
    next && source
      ? nextTokenMissions({
          next,
          open: missionsOf(missionRun),
          membersOf,
          enemiesOf: source.enemiesOf,
        })
      : null
  const byRun = supply
    ? splitPlanByRun(
        tokenPlan.tokens.length,
        supply,
        input.perRunDepths
          ? tokenPlan.tokens.map((token) => token.slot)
          : undefined
      )
    : null
  const ordered =
    source && byRun && tokenPlan.tokens.length > 0
      ? missionOrder({
          tokens: tokenPlan.tokens,
          sections: byRun.sections,
          missionsOf,
          completedOf: (run) =>
            completedMissions({
              event: source.event,
              runs: plan.data!.runs,
              currentRun: run,
              showPaidOptions: plan.data!.showPaidOptions,
            }),
          membersOf,
          enemiesOf: source.enemiesOf,
        })
      : null
  const orderedMarkers =
    ordered && supply && event.rewards
      ? forecastRuns({
          rewards: event.rewards,
          ohSoCloseOffer: event.ohSoCloseOffer,
          progress: entry,
          supply,
          fromStep: unitNextAscensionStep(input.eventUnit),
          tokens: ordered.tokens,
          runs: plan.data.runs,
          showPaidOptions: plan.data.showPaidOptions,
        }).markers
      : []

  return {
    kind: "ready",
    plan: tokenPlan,
    next,
    missions,
    empty: tokenPlan.tokens.length > 0 ? null : emptyReason(tokenPlan, lanes),
    membersByTeam,
    depthByTeam,
    fullClear: lanes.flatMap((lane) => {
      const figure = fewestTokensForFullClear(
        lane.teams,
        lane.model.objectives.length
      )
      return figure ? [{ laneId: lane.laneId, figure }] : []
    }),
    forecast,
    byRun,
    missionOrder: ordered
      ? {
          ...ordered,
          markers: orderedMarkers,
          nextProgress: source
            ? tokenMissionProgress(
                {
                  open: missionsOf(missionRun),
                  membersOf,
                  enemiesOf: source.enemiesOf,
                },
                ordered.tokens[firstPlayableIndex(ordered.tokens)]!
              )
            : [],
        }
      : null,
    upcoming:
      lifecycle.state !== "upcoming" ? null : { run: resolution.nextRun },
    milestoneGap: gap,
    leftover:
      tokensLeftOver > 0
        ? { tokens: tokensLeftOver, laneId: firstLaneWithPoints }
        : null,
  }
}

/** The supply slots of each run that is not Done, in order. */
function supplySlots(supply: readonly RunSupply[]): RunSlots[] {
  const slots: RunSlots[] = []
  let start = 0
  for (const entry of supply) {
    if (entry.state === "done") continue
    slots.push({ run: entry.run, start, end: start + entry.total })
    start += entry.total
  }
  return slots
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

/** How many planned tokens the Next token card lists after the next one. */
const UP_NEXT_COUNT = 4

/** The planned tokens after the next one, in plan order with their plan indexes (the next token is
 *  not always the plan's first; the ones it skipped are not up next). */
export function upNextTokens<T>(
  plan: { tokens: readonly T[] },
  next: { index: number } | null,
  count = UP_NEXT_COUNT
): { token: T; index: number }[] {
  return (
    plan.tokens
      .map((token, index) => ({ token, index }))
      // After the next one: tokens before it were skipped (flagged or not playable yet).
      .filter((entry) => next === null || entry.index > next.index)
      .slice(0, count)
  )
}

/** The Next token card in Missions order (spec: Next token card Points / Missions switch): the
 *  first token of the Missions order that could be played next (else its first), with the
 *  missions it moves; null without a Missions order or a token. */
export function missionsNextToken(view: Pick<TokenPlanReady, "missionOrder">): {
  token: PlannedToken
  index: number
  gains: MissionGain[]
} | null {
  const order = view.missionOrder
  if (!order || order.tokens.length === 0) return null
  const index = firstPlayableIndex(order.tokens)
  // The order's steps replay every token before this one; once earlier ones are skipped, only the
  // current missions say what this play adds.
  const gains =
    index === 0
      ? gainsFromSteps(order.steps[0] ?? [])
      : gainsFromProgress(order.nextProgress)
  return { token: order.tokens[index]!, index, gains }
}

/** The first token that could be played next, else the first. */
function firstPlayableIndex(tokens: readonly PlannedToken[]): number {
  const found = tokens.findIndex((_, index) => playableNext(tokens, index))
  return found === -1 ? 0 : found
}
