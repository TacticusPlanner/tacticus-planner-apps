import {
  HRE_DAILY_PAYOUTS,
  HRE_OH_SO_CLOSE_SHARDS,
  type HreRarityStepId,
} from "./hre-reward-tables"
import type { HreBracket, HreRewardRules, HreStep } from "./hre-rules"

const DAY_MS = 86_400_000

/** The bracket of a leaderboard position; no rank uses the lowest bracket. */
export function bracketForRank(
  rules: HreRewardRules,
  rank: number | null
): HreBracket {
  const last = rules.brackets[rules.brackets.length - 1]!
  if (rank === null) return last
  return rules.brackets.find((bracket) => rank <= bracket.upTo) ?? last
}

/** The positions a bracket covers ("2,501 to 5,000"); `to` null for the open-ended last one. */
export function bracketRange(
  rules: HreRewardRules,
  bracket: HreBracket
): {
  from: number
  to: number | null
} {
  const index = rules.brackets.indexOf(bracket)
  const from = index > 0 ? rules.brackets[index - 1]!.upTo + 1 : 1
  return { from, to: Number.isFinite(bracket.upTo) ? bracket.upTo : null }
}

/** Cumulative milestone currency for an event-points total. */
function milestoneCurrency(rules: HreRewardRules, points: number): number {
  let currency = 0
  for (const milestone of rules.milestones) {
    if (points < milestone.points) break
    currency = milestone.cumulative
  }
  return currency
}

/** The next milestone above `points` and the currency it adds; null once every one is reached. */
function nextMilestoneFor(rules: HreRewardRules, points: number) {
  const index = rules.milestones.findIndex((item) => item.points > points)
  if (index < 0) return null
  const previous = index > 0 ? rules.milestones[index - 1]!.cumulative : 0
  const milestone = rules.milestones[index]!
  return { points: milestone.points, reward: milestone.cumulative - previous }
}

/**
 * The chests opened from tier `from` upward while the currency covers the next cost: the last tier
 * opened (`from` − 1 when none), their cost and their minimum shards.
 */
function chestTierFor(rules: HreRewardRules, currency: number, from = 1) {
  let tier = from - 1
  let spent = 0
  let shards = 0
  for (const chest of rules.chests.slice(from - 1)) {
    if (spent + chest.cost > currency) break
    tier += 1
    spent += chest.cost
    shards += chest.shards
  }
  return { tier, spent, shards }
}

/** Whole local calendar days from `fromMs` to `toMs` (0 on the same day). */
export function calendarDaysBetween(fromMs: number, toMs: number): number {
  const midnight = (ms: number) => {
    const date = new Date(ms)
    return new Date(
      date.getFullYear(),
      date.getMonth(),
      date.getDate()
    ).getTime()
  }
  return Math.max(0, Math.round((midnight(toMs) - midnight(fromMs)) / DAY_MS))
}

/** The steps a hero of this starting rarity can reach: its unlock and every step after it. */
export function stepsFor(
  rules: HreRewardRules,
  startRarity: string | null
): readonly HreStep[] {
  const index = rules.steps.findIndex((step) => step.unlockFor === startRarity)
  return rules.steps.slice(Math.max(index, 0))
}

/** The featured hero's step as the event screen shows it: "none" before the unlock. */
export type HreOwnedStep = HreRarityStepId | "none"

/** What the player holds now, read off the game's event screen (design D1), every input set. */
export type HreOwned = {
  currency: number
  /** The tier on the chest button, from 1 to the last chest. */
  nextTier: number
  step: HreOwnedStep
  /** Shards toward the next step; 0 at the last step. */
  toNext: number
}

/** The owned inputs as stored, each null until entered. */
export type HreOwnedInput = {
  currency: number | null
  nextTier: number | null
  step: string | null
  toNext: number | null
}

/** The step after `step` (the hero's first step after "none"), or null at the last step. */
function stepAfter(
  rules: HreRewardRules,
  step: HreOwnedStep,
  startRarity: string | null
): HreStep | null {
  const steps = stepsFor(rules, startRarity)
  if (step === "none") return steps[0] ?? null
  const index = rules.steps.findIndex((item) => item.id === step)
  return rules.steps[index + 1] ?? null
}

/** The shards from `step` to the next one ("none" counts from 0), or null at the last step. */
export function stepGap(
  rules: HreRewardRules,
  step: HreOwnedStep,
  startRarity: string | null
): number | null {
  const next = stepAfter(rules, step, startRarity)
  if (!next) return null
  const current = rules.steps.find((item) => item.id === step)
  return next.shards - (current?.shards ?? 0)
}

/** The owned inputs as one group, or null until every one of them is set (design D1). */
export function ownedFrom(
  rules: HreRewardRules,
  input: HreOwnedInput,
  startRarity: string | null
): HreOwned | null {
  const { currency, nextTier, step } = input
  if (currency === null || nextTier === null || step === null) return null
  if (step !== "none" && !rules.steps.some((item) => item.id === step))
    return null
  const gap = stepGap(rules, step as HreOwnedStep, startRarity)
  if (gap !== null && input.toNext === null) return null
  return {
    currency,
    nextTier: Math.min(Math.max(nextTier, 1), rules.chests.length),
    step: step as HreOwnedStep,
    toNext: gap === null ? 0 : Math.min(input.toNext ?? 0, gap - 1),
  }
}

export type HrePaceInput = {
  points: number
  rank: number | null
  /** When the rank was entered (ms), or null when unknown. */
  rankAt?: number | null
  /** The tracker's current mission, 1 to 22; only the owned projection uses it. */
  mission?: number
  /** What the player holds now; null keeps the points-only chain. */
  owned?: HreOwned | null
  startMs: number
  endMs: number
  nowMs: number
  /** The featured hero's starting rarity, or null when unknown (steps then start at Common). */
  startRarity: string | null
  target: HreRarityStepId | null
}

type HreTargetNeeds = {
  step: HreStep
  /** The projected points cover the points needed. */
  reached: boolean
  /** With the owned inputs: no chest shards are needed any more. */
  covered: boolean
  /** With the owned inputs: no days left and not covered. */
  timeUp: boolean
  /** Shards still to come from chests after the shards held and the crates, and the chest tier
   * giving them. */
  chestShards: number
  chestTier: number | null
  currency: number | null
  /** Milestone currency needed after what is owned, missions, payouts and crates. */
  milestoneCurrency: number | null
  points: number | null
  pointsPerDay: number | null
  /** Projected points beyond what the target needs (when reached). */
  margin: number | null
}

export type HrePace = {
  bracket: HreBracket
  rankKnown: boolean
  /** Local calendar days since the rank was entered, or null when unknown. */
  rankAgeDays: number | null
  elapsedDays: number
  daysLeft: number
  averagePerDay: number
  projectedPoints: number
  /** Currency by source; with the owned inputs, what is owned plus only the income still to come. */
  currency: {
    owned: number | null
    milestones: number
    missions: number
    daily: number
    crates: number
    total: number
  }
  /** The chests opened: tiers `from` to `tier`, none when `tier` is below `from`. */
  chest: { from: number; tier: number; spent: number; left: number }
  /** Shards by source, a minimum: each chest counts the low end of its range. */
  shards: {
    held: number | null
    chests: number
    crates: number
    total: number
  }
  /** The step held and the shards toward the next one, with the owned inputs. */
  owned: {
    step: HreStep | null
    toNext: number
    next: HreStep | null
    gap: number | null
  } | null
  /** The next milestone and its reward, or null once every milestone is reached. */
  nextMilestone: { points: number; reward: number } | null
  /** With the owned inputs: the next chest's tier, cost and the currency still missing for it. */
  nextChest: { tier: number; cost: number; missing: number } | null
  /** The highest step reached, or null when not even the unlock is. */
  reached: HreStep | null
  next: HreStep | null
  /** Shards short of `next`, and whether the Oh So Close offer covers that gap. */
  shortOfNext: number | null
  ohSoClose: boolean
  target: HreTargetNeeds | null
}

/** What the target is measured from: everything the projection counts apart from milestones. */
type TargetBase = {
  /** Shards held now (owned) or none. */
  held: number
  crateShards: number
  /** The first chest tier still to open. */
  fromTier: number
  /** Currency owned plus the missions, payouts and crates still to come. */
  fixed: number
  /** Milestone currency already earned (owned) or none. */
  milestonesNow: number
  owned: boolean
}

function targetNeeds(
  rules: HreRewardRules,
  step: HreStep,
  base: TargetBase,
  input: HrePaceInput,
  projectedPoints: number,
  daysLeft: number
): HreTargetNeeds {
  const chestShards = Math.max(0, step.shards - base.held - base.crateShards)
  let tier: number | null = null
  let cost = 0
  let shards = 0
  if (chestShards === 0) tier = 0
  else {
    for (const [index, chest] of rules.chests.entries()) {
      if (index + 1 < base.fromTier) continue
      cost += chest.cost
      shards += chest.shards
      if (shards >= chestShards) {
        tier = index + 1
        break
      }
    }
  }
  const covered = base.owned && chestShards === 0
  const timeUp = base.owned && !covered && daysLeft <= 0
  const currency = tier === null ? null : tier === 0 ? 0 : cost
  const fromMilestones =
    currency === null || timeUp ? null : Math.max(0, currency - base.fixed)
  let points: number | null = null
  if (fromMilestones === 0) points = base.owned ? input.points : 0
  else if (fromMilestones !== null)
    points =
      rules.milestones.find(
        (item) => item.cumulative >= base.milestonesNow + fromMilestones
      )?.points ?? null
  const reached = points !== null && projectedPoints >= points
  return {
    step,
    reached,
    covered,
    timeUp,
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
 * chest tier, then shards by source, then the step reached, plus what the chosen target needs. With
 * the owned inputs (design D2) it starts from what the player holds and adds only the income still
 * to come.
 */
export function projectHrePace(
  rules: HreRewardRules,
  input: HrePaceInput
): HrePace {
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

  const bracket = bracketForRank(rules, input.rank)
  const owned = input.owned ?? null
  // Owned: payouts arrive on days 2 to 15 and the week 1 crate at day 7, so count what is left.
  const milestonesNow = owned ? milestoneCurrency(rules, input.points) : 0
  const milestones = milestoneCurrency(rules, projectedPoints) - milestonesNow
  const { missionCurrency, paidMissions } = rules
  const missionsDone = Math.min((input.mission ?? 1) - 1, paidMissions)
  const missions = owned
    ? (paidMissions - missionsDone) * (missionCurrency / paidMissions)
    : missionCurrency
  const payouts = owned
    ? Math.max(0, HRE_DAILY_PAYOUTS - Math.floor(sinceStart))
    : HRE_DAILY_PAYOUTS
  const daily = bracket.daily * payouts
  const week1 = !owned || sinceStart < 7
  const crates = (week1 ? bracket.week1.currency : 0) + bracket.week2.currency
  const crateShards = (week1 ? bracket.week1.shards : 0) + bracket.week2.shards
  const fixed = (owned?.currency ?? 0) + missions + daily + crates
  const total = fixed + milestones
  const fromTier = owned?.nextTier ?? 1
  const chest = chestTierFor(rules, total, fromTier)
  const ownedStep = owned
    ? (rules.steps.find((step) => step.id === owned.step) ?? null)
    : null
  const held = owned ? (ownedStep?.shards ?? 0) + owned.toNext : null
  const shardTotal = (held ?? 0) + chest.shards + crateShards

  const steps = stepsFor(rules, input.startRarity)
  const reached = [...steps].reverse().find((step) => shardTotal >= step.shards)
  const next = steps.find((step) => shardTotal < step.shards) ?? null
  const shortOfNext = next ? next.shards - shardTotal : null
  const targetStep =
    steps.find((step) => step.id === input.target) ?? next ?? null
  const nextChestCost = owned ? rules.chests[fromTier - 1]?.cost : undefined

  return {
    bracket,
    rankKnown: input.rank !== null,
    rankAgeDays:
      input.rank !== null && input.rankAt != null
        ? calendarDaysBetween(input.rankAt, input.nowMs)
        : null,
    elapsedDays,
    daysLeft,
    averagePerDay: Math.round(averagePerDay),
    projectedPoints,
    currency: {
      owned: owned?.currency ?? null,
      milestones,
      missions,
      daily,
      crates,
      total,
    },
    chest: {
      from: fromTier,
      tier: chest.tier,
      spent: chest.spent,
      left: total - chest.spent,
    },
    shards: {
      held,
      chests: chest.shards,
      crates: crateShards,
      total: shardTotal,
    },
    owned: owned
      ? {
          step: ownedStep,
          toNext: owned.toNext,
          next: stepAfter(rules, owned.step, input.startRarity),
          gap: stepGap(rules, owned.step, input.startRarity),
        }
      : null,
    nextMilestone: nextMilestoneFor(rules, input.points),
    nextChest:
      owned && nextChestCost !== undefined
        ? {
            tier: fromTier,
            cost: nextChestCost,
            missing: Math.max(0, nextChestCost - owned.currency),
          }
        : null,
    reached: reached ?? null,
    next,
    shortOfNext,
    ohSoClose: shortOfNext !== null && shortOfNext <= HRE_OH_SO_CLOSE_SHARDS,
    target: targetStep
      ? targetNeeds(
          rules,
          targetStep,
          {
            held: held ?? 0,
            crateShards,
            fromTier,
            fixed,
            milestonesNow,
            owned: owned !== null,
          },
          input,
          projectedPoints,
          daysLeft
        )
      : null,
  }
}

/** The pace for a running instance once points are entered; null otherwise (preview, no points). */
export function hrePaceFor(
  rules: HreRewardRules,
  input: {
    running: boolean
    startUtc: string
    endUtc: string
    nowMs: number
    points: number | null
    rank: number | null
    rankAt?: number | null
    mission?: number
    owned?: HreOwnedInput | null
    target: string | null
    startRarity: string | null
  }
): HrePace | null {
  if (!input.running || input.points === null) return null
  const known = rules.steps.some((step) => step.id === input.target)
  return projectHrePace(rules, {
    points: input.points,
    rank: input.rank,
    rankAt: input.rankAt,
    mission: input.mission,
    owned: input.owned
      ? ownedFrom(rules, input.owned, input.startRarity)
      : null,
    startMs: Date.parse(input.startUtc),
    endMs: Date.parse(input.endUtc),
    nowMs: input.nowMs,
    startRarity: input.startRarity,
    target: known ? (input.target as HreRarityStepId) : null,
  })
}

/** Days the event has left: from now while it runs, its whole length for a preview. */
export function hreDaysLeft(input: {
  running: boolean
  startUtc: string
  endUtc: string
  nowMs: number
}): number {
  const startMs = Date.parse(input.startUtc)
  const endMs = Date.parse(input.endUtc)
  const from = input.running ? input.nowMs : startMs
  return Math.max(0, (endMs - from) / DAY_MS)
}
