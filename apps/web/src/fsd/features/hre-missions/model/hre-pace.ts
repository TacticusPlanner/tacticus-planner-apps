import {
  HRE_BRACKETS,
  HRE_CHESTS,
  HRE_DAILY_PAYOUTS,
  HRE_MILESTONES,
  HRE_MISSION_CURRENCY,
  HRE_OH_SO_CLOSE_SHARDS,
  HRE_RARITY_STEPS,
  type HreRarityStepId,
} from "./hre-reward-tables"

const DAY_MS = 86_400_000

export type HreBracket = (typeof HRE_BRACKETS)[number]

/** The bracket of a leaderboard position; no rank uses the lowest bracket. */
export function bracketForRank(rank: number | null): HreBracket {
  const last = HRE_BRACKETS[HRE_BRACKETS.length - 1]!
  if (rank === null) return last
  return HRE_BRACKETS.find((bracket) => rank <= bracket.upTo) ?? last
}

/** The positions a bracket covers ("2,501 to 5,000"); `to` null for the open-ended last one. */
export function bracketRange(bracket: HreBracket): {
  from: number
  to: number | null
} {
  const index = HRE_BRACKETS.indexOf(bracket)
  const from = index > 0 ? HRE_BRACKETS[index - 1]!.upTo + 1 : 1
  return { from, to: Number.isFinite(bracket.upTo) ? bracket.upTo : null }
}

/** Cumulative milestone currency for an event-points total. */
function milestoneCurrency(points: number): number {
  let currency = 0
  for (const milestone of HRE_MILESTONES) {
    if (points < milestone.points) break
    currency = milestone.cumulative
  }
  return currency
}

/** The highest chest tier whose cumulative cost fits, with its cost and shards. */
function chestTierFor(currency: number) {
  let tier = 0
  let spent = 0
  let shards = 0
  for (const chest of HRE_CHESTS) {
    if (spent + chest.cost > currency) break
    tier += 1
    spent += chest.cost
    shards += chest.shards
  }
  return { tier, spent, shards }
}

export type HreStep = (typeof HRE_RARITY_STEPS)[number]

/** The steps a hero of this starting rarity can reach: its unlock and every step after it. */
export function stepsFor(startRarity: string | null): readonly HreStep[] {
  const index = HRE_RARITY_STEPS.findIndex(
    (step) => step.unlockFor === startRarity
  )
  return HRE_RARITY_STEPS.slice(Math.max(index, 0))
}

export type HrePaceInput = {
  points: number
  rank: number | null
  startMs: number
  endMs: number
  nowMs: number
  /** The featured hero's starting rarity, or null when unknown (steps then start at Common). */
  startRarity: string | null
  target: HreRarityStepId | null
}

type HreTargetNeeds = {
  step: HreStep
  reached: boolean
  /** Shards still to come from chests after the weekly crates, and the chest tier giving them. */
  chestShards: number
  chestTier: number | null
  currency: number | null
  /** Milestone currency needed after missions, payouts and crates. */
  milestoneCurrency: number | null
  points: number | null
  pointsPerDay: number | null
  /** Projected points beyond what the target needs (when reached). */
  margin: number | null
}

export type HrePace = {
  bracket: HreBracket
  rankKnown: boolean
  elapsedDays: number
  daysLeft: number
  averagePerDay: number
  projectedPoints: number
  currency: {
    milestones: number
    missions: number
    daily: number
    crates: number
    total: number
  }
  chest: { tier: number; spent: number; left: number }
  shards: { chests: number; crates: number; total: number }
  /** The highest step reached, or null when not even the unlock is. */
  reached: HreStep | null
  next: HreStep | null
  /** Shards short of `next`, and whether the Oh So Close offer covers that gap. */
  shortOfNext: number | null
  ohSoClose: boolean
  target: HreTargetNeeds | null
}

function targetNeeds(
  step: HreStep,
  bracket: HreBracket,
  input: HrePaceInput,
  projectedPoints: number,
  daysLeft: number
): HreTargetNeeds {
  const crateShards = bracket.week1.shards + bracket.week2.shards
  const chestShards = Math.max(0, step.shards - crateShards)
  let tier: number | null = null
  let cost = 0
  let shards = 0
  if (chestShards === 0) tier = 0
  else {
    for (const [index, chest] of HRE_CHESTS.entries()) {
      cost += chest.cost
      shards += chest.shards
      if (shards >= chestShards) {
        tier = index + 1
        break
      }
    }
  }
  const currency = tier === null ? null : tier === 0 ? 0 : cost
  const fixed =
    HRE_MISSION_CURRENCY +
    bracket.daily * HRE_DAILY_PAYOUTS +
    bracket.week1.currency +
    bracket.week2.currency
  const fromMilestones =
    currency === null ? null : Math.max(0, currency - fixed)
  const points =
    fromMilestones === null
      ? null
      : fromMilestones === 0
        ? 0
        : (HRE_MILESTONES.find((item) => item.cumulative >= fromMilestones)
            ?.points ?? null)
  const reached = points !== null && projectedPoints >= points
  return {
    step,
    reached,
    chestShards,
    chestTier: tier,
    currency,
    milestoneCurrency: fromMilestones,
    points,
    pointsPerDay:
      points === null
        ? null
        : Math.ceil(Math.max(0, points - input.points) / Math.max(daysLeft, 1)),
    margin: reached && points !== null ? projectedPoints - points : null,
  }
}

/**
 * The HRE pace chain in one result (design D7): projected points, then currency by source, then the
 * chest tier, then shards by source, then the step reached, plus what the chosen target needs.
 */
export function projectHrePace(input: HrePaceInput): HrePace {
  const totalDays = Math.max(1, (input.endMs - input.startMs) / DAY_MS)
  const sinceStart = Math.min(
    totalDays,
    Math.max(0, (input.nowMs - input.startMs) / DAY_MS)
  )
  // The average divides by at least one day; the days left are the real remainder.
  const elapsedDays = Math.max(1, sinceStart)
  const daysLeft = totalDays - sinceStart
  const averagePerDay = input.points / elapsedDays
  const projectedPoints = Math.round(input.points + averagePerDay * daysLeft)

  const bracket = bracketForRank(input.rank)
  const milestones = milestoneCurrency(projectedPoints)
  const daily = bracket.daily * HRE_DAILY_PAYOUTS
  const crates = bracket.week1.currency + bracket.week2.currency
  const total = milestones + HRE_MISSION_CURRENCY + daily + crates
  const chest = chestTierFor(total)
  const crateShards = bracket.week1.shards + bracket.week2.shards
  const shardTotal = chest.shards + crateShards

  const steps = stepsFor(input.startRarity)
  const reached = [...steps].reverse().find((step) => shardTotal >= step.shards)
  const next = steps.find((step) => shardTotal < step.shards) ?? null
  const shortOfNext = next ? next.shards - shardTotal : null
  const targetStep =
    steps.find((step) => step.id === input.target) ?? next ?? null

  return {
    bracket,
    rankKnown: input.rank !== null,
    elapsedDays,
    daysLeft,
    averagePerDay: Math.round(averagePerDay),
    projectedPoints,
    currency: {
      milestones,
      missions: HRE_MISSION_CURRENCY,
      daily,
      crates,
      total,
    },
    chest: { tier: chest.tier, spent: chest.spent, left: total - chest.spent },
    shards: { chests: chest.shards, crates: crateShards, total: shardTotal },
    reached: reached ?? null,
    next,
    shortOfNext,
    ohSoClose: shortOfNext !== null && shortOfNext <= HRE_OH_SO_CLOSE_SHARDS,
    target: targetStep
      ? targetNeeds(targetStep, bracket, input, projectedPoints, daysLeft)
      : null,
  }
}

/** The pace for a running instance once points are entered; null otherwise (preview, no points). */
export function hrePaceFor(input: {
  running: boolean
  startUtc: string
  endUtc: string
  nowMs: number
  points: number | null
  rank: number | null
  target: string | null
  startRarity: string | null
}): HrePace | null {
  if (!input.running || input.points === null) return null
  const known = HRE_RARITY_STEPS.some((step) => step.id === input.target)
  return projectHrePace({
    points: input.points,
    rank: input.rank,
    startMs: Date.parse(input.startUtc),
    endMs: Date.parse(input.endUtc),
    nowMs: input.nowMs,
    startRarity: input.startRarity,
    target: known ? (input.target as HreRarityStepId) : null,
  })
}
