import type { AscensionStep } from "@/entities/legendary-event"

import { forecastRuns } from "./run-forecast"
import type { Forecast, ForecastInput } from "./run-forecast"
import { planTokens, playableNowChoices } from "./token-plan"
import type {
  PlannedToken,
  TokenChoiceKey,
  TokenPlan,
  TokenPlanInput,
} from "./token-plan"
import { splitPlanByRun } from "./token-runs"
import { firstDifference } from "@/shared/lib"

// The safest path to the run's milestone: the plan spends every token on the most points, but when
// the run's tokens only need to reach a points milestone (and the character step its payout opens),
// the next token is the safest battle that still gets there, not the biggest one.

/** How risky one token is: `band` 1 past the team's sure depth (a likely clear), else 0; `headroom`
 *  the battles the team clears past this one (its sure depth when it has bands). */
export interface TokenRisk {
  band: 0 | 1
  headroom: number
}

/** What the run's tokens reach under the most-points plan, and so what a safer path must reach. */
interface RunGoal {
  milestone: number
  /** The milestone's cumulative points. */
  points: number
  /** The last character step the run reaches (Unlock, 4 stars…), null when it reaches none. */
  step: AscensionStep | null
}

export interface SafestNextInput {
  planInput: TokenPlanInput
  /** The most-points plan of `planInput` and its forecast. */
  plan: TokenPlan
  forecast: Forecast
  forecastInput: Omit<ForecastInput, "tokens">
  /** A token's risk; null when its team has no depth. */
  riskOf: (
    token: Pick<PlannedToken, "teamId" | "battleIndex">
  ) => TokenRisk | null
}

export interface SafestNext {
  plan: TokenPlan
  forecast: Forecast
  goal: RunGoal
}

/** Negative when `a` is safer than `b`. */
export function compareRisk(a: TokenRisk, b: TokenRisk): number {
  return firstDifference(a.band - b.band, b.headroom - a.headroom)
}

const UNKNOWN_RISK: TokenRisk = { band: 1, headroom: 0 }

/** The run's goal: the milestone where it reaches its last character step, else its last milestone;
 *  null when the run's tokens cross no milestone. */
function runGoal(
  forecast: Forecast,
  milestones: ForecastInput["rewards"]["pointsMilestones"],
  runTokens: number
): RunGoal | null {
  const markers = forecast.markers.slice(0, runTokens)
  const stepAt = markers.findLastIndex((marker) => marker.steps.length > 0)
  const at =
    stepAt === -1
      ? markers.findLastIndex((marker) => marker.milestones.length > 0)
      : stepAt
  const marker = markers[at]
  if (!marker) return null
  const milestone = Math.max(
    ...marker.milestones.map((entry) => entry.milestone)
  )
  const points = milestones.find(
    (entry) => entry.milestone === milestone
  )?.cumulativePoints
  if (points === undefined) return null
  return { milestone, points, step: marker.steps.at(-1) ?? null }
}

const sameChoice = (a: TokenChoiceKey, b: TokenChoiceKey) =>
  a.laneId === b.laneId &&
  a.battleIndex === b.battleIndex &&
  a.teamId === b.teamId

/**
 * The plan that opens with the safest token still reaching the run's goal (spec: Next token picks
 * the least risky path to the milestone). Each battle playable now is tried first, the rest of the
 * run planned for points after it; a path is as risky as its riskiest token this run. The safest
 * path that reaches the goal wins when it is strictly safer than the most-points run, more run
 * points breaking a tie, then the safer first token. Null when the run reaches no milestone or
 * no path is safer.
 */
export function safestNextToken({
  planInput,
  plan,
  forecast,
  forecastInput,
  riskOf,
}: SafestNextInput): SafestNext | null {
  const section = splitPlanByRun(plan.tokens.length, forecastInput.supply)
    .sections[0]
  if (!section || section.count === 0) return null
  const runTokens = section.count
  const goal = runGoal(
    forecast,
    forecastInput.rewards.pointsMilestones,
    runTokens
  )
  if (!goal) return null

  const risk = (token: PlannedToken) => riskOf(token) ?? UNKNOWN_RISK
  const pathRisk = (tokens: readonly PlannedToken[]) =>
    tokens
      .map(risk)
      .reduce((worst, entry) => (compareRisk(entry, worst) > 0 ? entry : worst))
  // Only a strictly safer path replaces the most-points plan.
  const baseline = plan.tokens.slice(0, runTokens)
  const mostPointsRisk = pathRisk(baseline)
  let best: {
    choice: TokenChoiceKey
    plan: TokenPlan
    path: TokenRisk
    first: TokenRisk
    points: number
  } | null = null
  for (const choice of playableNowChoices(planInput.lanes)) {
    const candidate = planTokens({ ...planInput, first: choice })
    const head = candidate.tokens[0]
    if (!head || !sameChoice(head, choice)) continue
    const run = candidate.tokens.slice(0, runTokens)
    const points = run.at(-1)?.runningPoints ?? planInput.startingPoints
    if (points < goal.points) continue
    const path = pathRisk(run)
    if (compareRisk(path, mostPointsRisk) >= 0) continue
    const first = risk(head)
    const better =
      !best ||
      compareRisk(path, best.path) < 0 ||
      (compareRisk(path, best.path) === 0 &&
        (points > best.points ||
          (points === best.points && compareRisk(first, best.first) < 0)))
    if (better) best = { choice, plan: candidate, path, first, points }
  }
  if (!best) return null
  return {
    plan: best.plan,
    forecast: forecastRuns({ ...forecastInput, tokens: best.plan.tokens }),
    goal,
  }
}
