import type {
  LegendaryEventRun,
  LegendaryEventRunInputs,
} from "../model/plan.types"
import type {
  LegendaryEventProgress,
  LegendaryEventRewards,
} from "../model/types"
import { currentLegendaryEventRun } from "./current-run"
import { runInputValues } from "./run-inputs"

// Ported from V1 `LeProgressService.computeProgress` with the synced state as its base (design D2,
// deliberate deviations in D3). Pure: every surface (the Run status card now, Stage 4's forecast
// later) reads the one `RewardProjection` it returns.

/** A regular or premium mission pays 25 currency… */
export const MISSION_CURRENCY = 25
/** …plus 15 per mission, per bundle and per points payout while the premium track is bought. */
export const PREMIUM_BONUS_CURRENCY = 15
/** The 300-currency bundle. */
export const BUNDLE_CURRENCY = 300
/** V1's average points per battle for the "battles per lane" figure (three lanes are played). */
export const BATTLE_POINTS_AVERAGE = 500
const LANE_COUNT = 3

/** The event unit's ascension steps, in order; each adds its `progression` shards. */
export const ASCENSION_STEPS = [
  "unlock",
  "fourStars",
  "fiveStars",
  "blueStar",
  "mythic",
  "twoBlueStars",
] as const

export type AscensionStep = (typeof ASCENSION_STEPS)[number]

export interface RewardProjectionInput {
  rewards: LegendaryEventRewards
  /** The account's synced entry for the event; `undefined` when it has none (the base is zero). */
  progress:
    | Pick<
        LegendaryEventProgress,
        | "currentPoints"
        | "currentCurrency"
        | "currentClaimedChestIndex"
        | "currentShards"
        | "currentEventRun"
        | "extraCurrencyPerPayout"
      >
    | undefined
  /** The plan's stored run inputs (absent runs read as zeros). */
  runs: readonly LegendaryEventRunInputs[] | undefined
  showPaidOptions: boolean
}

/** One future run's contribution (runs already started are counted through sync). */
interface FutureRunContribution {
  run: LegendaryEventRun
  missionCurrency: number
  bundleCurrency: number
  closeShards: number
}

export interface RewardProjection {
  /** The synced facts the projection starts from (zeros without an entry). */
  base: {
    points: number
    currency: number
    chestsClaimed: number
    shards: number
  }
  /** The run the synced entry is in (1 without an entry). */
  currentRun: LegendaryEventRun
  /** Whether the account has a synced entry for the event. */
  synced: boolean
  /** Only future runs' inputs count, in run order. */
  futureRuns: FutureRunContribution[]
  futureCloseShards: number
  /** Added to every points milestone payout (synced `extraCurrencyPerPayout`, or 15 with premium). */
  bonusPerPayout: number
  goal:
    | {
        step: AscensionStep
        /** Cumulative shards that complete the step. */
        threshold: number
        /** Shards held (plus future close shards) beyond the previous step. */
        shardsTowardStep: number
        /** Shards this step takes on its own. */
        stepSize: number
      }
    | { step: "fullyAscended" }
  /** `null` when every step is reached. */
  chests:
    | { beyondChestLadder: false; required: number; toGo: number }
    | {
        beyondChestLadder: true
        required: number
        /** The event's chest count. */
        ladderSize: number
      }
    | null
  /** `null` unless the goal is reachable. */
  currency: {
    required: number
    collected: number
    futureMissions: number
    futureBundles: number
    fromPoints: number
  } | null
  /** `null` unless the goal is reachable. */
  points:
    | { state: "affordableNow" }
    | {
        state: "milestone"
        milestone: number
        cumulativePoints: number
        pointsToGo: number
        averageBattlesPerLane: number
      }
    | { state: "beyondPointsLadder"; currencyShort: number }
    | null
}

const RUNS: readonly LegendaryEventRun[] = [1, 2, 3]

function chestCost(rewards: LegendaryEventRewards, chestCount: number): number {
  return rewards.chestsMilestones
    .filter((chest) => chest.chestLevel <= chestCount)
    .reduce((sum, chest) => sum + chest.engramCost, 0)
}

/**
 * The next ascension step of the event unit and what it takes to reach it (design D2): chests to
 * go, the currency those chests cost, how much future missions and bundles cover, and the points
 * milestone whose payouts cover the rest.
 */
export function projectRewards({
  rewards,
  progress,
  runs,
  showPaidOptions,
}: RewardProjectionInput): RewardProjection {
  // 1. Base from sync.
  const base = {
    points: progress?.currentPoints ?? 0,
    currency: progress?.currentCurrency ?? 0,
    chestsClaimed: Math.max(0, progress?.currentClaimedChestIndex ?? 0),
    shards: progress?.currentShards ?? 0,
  }
  const currentRun = currentLegendaryEventRun(progress)

  // 2–3. Future runs: after the current run, or every run without a synced entry.
  const futureRuns = RUNS.filter((run) => !progress || run > currentRun).map(
    (run): FutureRunContribution => {
      const values = runInputValues(runs, run)
      const premium = showPaidOptions ? values.premiumMissions : 0
      const bonus = premium > 0 ? PREMIUM_BONUS_CURRENCY : 0
      return {
        run,
        missionCurrency:
          (values.regularMissions + premium) * (MISSION_CURRENCY + bonus),
        bundleCurrency:
          showPaidOptions && values.bundlePurchased
            ? BUNDLE_CURRENCY + bonus
            : 0,
        closeShards: showPaidOptions ? values.closeShards : 0,
      }
    }
  )
  const futureMissions = futureRuns.reduce(
    (sum, run) => sum + run.missionCurrency,
    0
  )
  const futureBundles = futureRuns.reduce(
    (sum, run) => sum + run.bundleCurrency,
    0
  )
  const futureCloseShards = futureRuns.reduce(
    (sum, run) => sum + run.closeShards,
    0
  )

  // 7. Per-payout bonus.
  const syncedBonus = progress?.extraCurrencyPerPayout ?? 0
  const bonusPerPayout =
    syncedBonus > 0
      ? syncedBonus
      : showPaidOptions && runInputValues(runs, currentRun).premiumMissions > 0
        ? PREMIUM_BONUS_CURRENCY
        : 0

  const projection: RewardProjection = {
    base,
    currentRun,
    synced: progress !== undefined,
    futureRuns,
    futureCloseShards,
    bonusPerPayout,
    goal: { step: "fullyAscended" },
    chests: null,
    currency: null,
    points: null,
  }

  // 4. The first cumulative threshold above the shards held plus future close shards.
  const shards = base.shards + futureCloseShards
  let previous = 0
  for (const step of ASCENSION_STEPS) {
    const threshold = previous + rewards.progression[step]
    if (threshold > shards) {
      projection.goal = {
        step,
        threshold,
        shardsTowardStep: Math.max(0, shards - previous),
        stepSize: threshold - previous,
      }
      break
    }
    previous = threshold
  }
  if (projection.goal.step === "fullyAscended") return projection

  // 5. Chests: shards held count whatever their source, so to-go is never negative.
  const toGo = Math.max(
    0,
    Math.ceil((projection.goal.threshold - shards) / rewards.shardsPerChest)
  )
  const required = base.chestsClaimed + toGo
  const ladderSize = rewards.chestsMilestones.length
  if (required > ladderSize) {
    projection.chests = { beyondChestLadder: true, required, ladderSize }
    return projection
  }
  projection.chests = { beyondChestLadder: false, required, toGo }

  // 6. Currency.
  const currencyRequired = chestCost(rewards, required)
  const collected = chestCost(rewards, base.chestsClaimed) + base.currency
  const fromPoints =
    currencyRequired - collected - futureMissions - futureBundles
  projection.currency = {
    required: currencyRequired,
    collected,
    futureMissions,
    futureBundles,
    fromPoints,
  }

  // 8–9. Points: drain the milestones above the current points until the payouts cover the rest.
  if (fromPoints <= 0) {
    projection.points = { state: "affordableNow" }
    return projection
  }
  let missing = fromPoints
  for (const milestone of rewards.pointsMilestones) {
    if (milestone.cumulativePoints <= base.points) continue
    missing -= milestone.engramPayout + bonusPerPayout
    if (missing <= 0) {
      projection.points = {
        state: "milestone",
        milestone: milestone.milestone,
        cumulativePoints: milestone.cumulativePoints,
        pointsToGo: milestone.cumulativePoints - base.points,
        averageBattlesPerLane:
          Math.round(
            (milestone.cumulativePoints / LANE_COUNT / BATTLE_POINTS_AVERAGE) *
              10
          ) / 10,
      }
      return projection
    }
  }
  projection.points = { state: "beyondPointsLadder", currencyShort: missing }
  return projection
}
