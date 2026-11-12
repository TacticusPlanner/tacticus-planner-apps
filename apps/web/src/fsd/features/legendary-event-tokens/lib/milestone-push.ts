import type {
  AscensionStep,
  LegendaryEventLaneId,
  LegendaryEventRun,
} from "@/entities/legendary-event"

import {
  forecastRuns,
  type ForecastInput,
  type RunForecast,
} from "./run-forecast"
import {
  planTokens,
  type PlannedToken,
  type TokenPlanInput,
  type TokenPlanLane,
} from "./token-plan"
import { splitPlanByRun } from "./token-runs"

// "Close the gap": when the current run's forecast falls short of the next reward step, which of the
// battles the plan leaves out could close it. Every push is one token, ranked by the points it adds
// to the run net of the token it pushes out (the forecast spends a fixed supply).

/** Why a battle is out of the plan: a Stop here mark (another team may clear it), or a team's
 *  manual depth set below its clear estimate. */
type MilestonePushKind = "stopHere" | "belowEstimate"

/** A planned token, as a push names the one it adds or drops. */
export interface PushToken {
  laneId: LegendaryEventLaneId
  /** 0-based battle index. */
  battleIndex: number
  teamId: string
  teamName: string
  points: number
}

export interface MilestonePush {
  kind: MilestonePushKind
  /** The battle the push plays, with the team the replanned run gives it. */
  token: PushToken
  /** Points it adds to the run, net of what it pushes out. */
  gain: number
  /** On its own it reaches the next step this run. */
  closesGap: boolean
  /** The run's token it pushes out (the run has no spare token); null when a spare token covers it. */
  displaced: PushToken | null
  /** What a failed attempt's retry costs: a spare token (`displaces` null), or the run's weakest
   *  remaining token. */
  retry: { displaces: PushToken | null }
}

export interface MilestoneGap {
  run: LegendaryEventRun
  step: AscensionStep
  shardsMissing: number
  /** Points the run still needs to reach `step` (the next milestone whose payout covers it). */
  pointsNeeded: number
  /** Best first, at most `MAX_PUSHES`. */
  pushes: MilestonePush[]
  /** When no push closes the gap alone: the fewest top pushes (indexes into `pushes`) that do
   *  together, with their summed gain; null when even all of them fall short. */
  combined: { indexes: number[]; gain: number } | null
}

const MAX_PUSHES = 5

/** A gap wider than this many chests is not "almost there": a push or two can't close it. */
const MAX_GAP_CHESTS = 2

/** A battle the plan leaves out, and how to put it back. */
interface PushCandidate {
  kind: MilestonePushKind
  laneId: LegendaryEventLaneId
  /** The Stop here cell to lift (`stopHere`). */
  cell?: { battleIndex: number; objectiveId: number }
  /** The team to give one more battle (`belowEstimate`). */
  teamId?: string
}

export interface MilestoneGapInput {
  plan: TokenPlanInput
  forecast: Omit<ForecastInput, "tokens">
  /** Each team's clear estimate depth (no manual depth); absent without one. */
  estimateDepthOf: (teamId: string) => number | null
}

const tokenKey = (
  token: Pick<PlannedToken, "laneId" | "battleIndex" | "teamId">
) => `${token.laneId}:${token.battleIndex}:${token.teamId}`

const pushToken = (token: PlannedToken): PushToken => ({
  laneId: token.laneId,
  battleIndex: token.battleIndex,
  teamId: token.teamId,
  teamName: token.teamName,
  points: token.points,
})

function nowRunTokens(
  tokens: readonly PlannedToken[],
  forecastInput: MilestoneGapInput["forecast"],
  run: LegendaryEventRun,
  perSlot: boolean
): PlannedToken[] {
  const section = splitPlanByRun(
    tokens.length,
    forecastInput.supply,
    perSlot ? tokens.map((token) => token.slot) : undefined
  ).sections.find((entry) => entry.run === run)
  return section
    ? tokens.slice(section.start, section.start + section.count)
    : []
}

function candidates(
  lanes: readonly TokenPlanLane[],
  estimateDepthOf: MilestoneGapInput["estimateDepthOf"]
): PushCandidate[] {
  return lanes.flatMap((lane) => [
    ...lane.annotations
      .filter((annotation) => annotation.status === "stopHere")
      .map((annotation): PushCandidate => ({
        kind: "stopHere",
        laneId: lane.laneId,
        cell: {
          battleIndex: annotation.battleIndex,
          objectiveId: annotation.objectiveId,
        },
      })),
    ...lane.teams.flatMap((team): PushCandidate[] => {
      const estimate = estimateDepthOf(team.id)
      return team.depth !== null && estimate !== null && team.depth < estimate
        ? [{ kind: "belowEstimate", laneId: lane.laneId, teamId: team.id }]
        : []
    }),
  ])
}

/** The plan's lanes with the candidates' battles put back. */
function relax(
  lanes: readonly TokenPlanLane[],
  applied: readonly PushCandidate[]
): TokenPlanLane[] {
  return lanes.map((lane) => {
    const mine = applied.filter((candidate) => candidate.laneId === lane.laneId)
    if (mine.length === 0) return lane
    const lifted = mine.flatMap((candidate) =>
      candidate.cell ? [candidate.cell] : []
    )
    const raised = new Set(
      mine.flatMap((candidate) => (candidate.teamId ? [candidate.teamId] : []))
    )
    return {
      ...lane,
      annotations: lane.annotations.filter(
        (annotation) =>
          !lifted.some(
            (cell) =>
              cell.battleIndex === annotation.battleIndex &&
              cell.objectiveId === annotation.objectiveId
          )
      ),
      teams: lane.teams.map((team) =>
        raised.has(team.id) && team.depth !== null
          ? { ...team, depth: team.depth + 1 }
          : team
      ),
    }
  })
}

/** The fewest points past `run.endingPoints` that reach `run.next`: the first points milestone
 *  whose payouts open enough chests. Null when no milestone does. */
function pointsToNextStep(
  input: MilestoneGapInput,
  base: readonly PlannedToken[],
  run: RunForecast,
  lastIndex: number
): number | null {
  if (run.next.step === "fullyAscended" || lastIndex < 0) return null
  const threshold = run.next.threshold
  const milestones = input.forecast.rewards.pointsMilestones
    .map((entry) => entry.cumulativePoints)
    .filter((points) => points > run.endingPoints)
    .sort((a, b) => a - b)
  for (const target of milestones) {
    const extra = target - run.endingPoints
    const tokens = base.map((token, index) =>
      index === lastIndex ? { ...token, points: token.points + extra } : token
    )
    const after = forecastRuns({ ...input.forecast, tokens }).runs.find(
      (entry) => entry.run === run.run
    )
    if (after && after.endingShards >= threshold) return extra
  }
  return null
}

/**
 * The current run's milestone gap and the pushes that close it (spec: close the gap), or null when
 * the run has no "now" forecast, reaches its next step, is more than `MAX_GAP_CHESTS` chests short,
 * or no points milestone gets there.
 */
export function milestoneGap(input: MilestoneGapInput): MilestoneGap | null {
  const perSlot = input.plan.runSlots !== undefined
  const evaluate = (lanes: readonly TokenPlanLane[]) => {
    const tokens = planTokens({ ...input.plan, lanes }).tokens
    const forecast = forecastRuns({ ...input.forecast, tokens })
    return { tokens, forecast }
  }
  const base = evaluate(input.plan.lanes)
  const run = base.forecast.runs.find((entry) => entry.state === "now")
  if (
    !run ||
    run.next.step === "fullyAscended" ||
    run.shardsMissing <= 0 ||
    run.shardsMissing > MAX_GAP_CHESTS * input.forecast.rewards.shardsPerChest
  ) {
    return null
  }
  const runOf = (forecast: typeof base.forecast) =>
    forecast.runs.find((entry) => entry.run === run.run)!
  const baseRunTokens = nowRunTokens(
    base.tokens,
    input.forecast,
    run.run,
    perSlot
  )
  const lastIndex = base.tokens.indexOf(baseRunTokens.at(-1)!)
  const pointsNeeded = pointsToNextStep(
    input,
    base.tokens,
    run,
    baseRunTokens.length > 0 ? lastIndex : -1
  )
  if (pointsNeeded === null) return null
  const threshold = run.next.threshold

  const pushes = candidates(input.plan.lanes, input.estimateDepthOf).flatMap(
    (candidate): (MilestonePush & { candidate: PushCandidate })[] => {
      const relaxed = evaluate(relax(input.plan.lanes, [candidate]))
      const after = runOf(relaxed.forecast)
      const gain = after.endingPoints - run.endingPoints
      if (gain <= 0) return []
      const runTokens = nowRunTokens(
        relaxed.tokens,
        input.forecast,
        run.run,
        perSlot
      )
      const baseKeys = new Set(baseRunTokens.map(tokenKey))
      const keys = new Set(runTokens.map(tokenKey))
      const added = runTokens.filter((token) => !baseKeys.has(tokenKey(token)))
      const played =
        added.find((token) =>
          candidate.cell
            ? token.battleIndex === candidate.cell.battleIndex &&
              token.laneId === candidate.laneId
            : token.teamId === candidate.teamId
        ) ?? added[0]
      if (!played) return []
      const dropped = baseRunTokens
        .filter((token) => !keys.has(tokenKey(token)))
        .sort((a, b) => a.points - b.points)
      const weakest = runTokens
        .filter((token) => token !== played)
        .sort((a, b) => a.points - b.points)[0]
      return [
        {
          candidate,
          kind: candidate.kind,
          token: pushToken(played),
          gain,
          closesGap: after.endingShards >= threshold,
          displaced: dropped[0] ? pushToken(dropped[0]) : null,
          retry: {
            displaces:
              after.tokensLeftOver > 0 || !weakest ? null : pushToken(weakest),
          },
        },
      ]
    }
  )
  // One push per battle and team: two Stop here cells of one battle play the same token.
  const unique = new Map<string, (typeof pushes)[number]>()
  for (const push of pushes.sort((a, b) => b.gain - a.gain)) {
    const key = tokenKey(push.token)
    if (!unique.has(key)) unique.set(key, push)
  }
  const ranked = [...unique.values()].slice(0, MAX_PUSHES)

  let combined: MilestoneGap["combined"] = null
  if (ranked.length > 1 && !ranked.some((push) => push.closesGap)) {
    for (let count = 2; count <= ranked.length; count++) {
      const applied = ranked.slice(0, count)
      const after = runOf(
        evaluate(
          relax(
            input.plan.lanes,
            applied.map((push) => push.candidate)
          )
        ).forecast
      )
      if (after.endingShards >= threshold) {
        combined = {
          indexes: applied.map((_, index) => index),
          gain: after.endingPoints - run.endingPoints,
        }
        break
      }
    }
  }

  return {
    run: run.run,
    step: run.next.step,
    shardsMissing: run.shardsMissing,
    pointsNeeded,
    pushes: ranked.map((push): MilestonePush => ({
      kind: push.kind,
      token: push.token,
      gain: push.gain,
      closesGap: push.closesGap,
      displaced: push.displaced,
      retry: push.retry,
    })),
    combined,
  }
}
