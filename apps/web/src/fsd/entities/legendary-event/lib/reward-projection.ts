import type {
  LegendaryEventRun,
  LegendaryEventRunInputs,
} from "../model/plan.types"
import { progressionIndex, type Progression } from "@workspace/game-domain"

import type {
  LegendaryEventProgress,
  LegendaryEventRewards,
  LegendaryEventRosterUnit,
} from "../model/types"
import { currentLegendaryEventRun } from "./current-run"
import { runInputValues } from "./run-inputs"
import type { LegendaryEventRunResolution } from "./run-resolution"

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

/** The progression state each ascension step reaches (spec: reward projection, goal). */
export const ASCENSION_STEP_PROGRESSION: Readonly<
  Record<AscensionStep, Progression>
> = {
  unlock: "Legendary:RedThreeStars",
  fourStars: "Legendary:RedFourStars",
  fiveStars: "Legendary:RedFiveStars",
  blueStar: "Legendary:OneBlueStar",
  mythic: "Mythic:OneBlueStar",
  twoBlueStars: "Mythic:TwoBlueStars",
}

/**
 * The event unit's next ascension step (design D5): the first step whose progression state is
 * later than the unit's synced `progressionIndex` in the game-domain order, `unlock` when the unit
 * is not in the roster, and `fullyAscended` when every step's state is reached.
 */
export function unitNextAscensionStep(
  unit: Pick<LegendaryEventRosterUnit, "progressionIndex"> | undefined
): AscensionStep | "fullyAscended" {
  if (!unit) return "unlock"
  const held = progressionIndex(unit.progressionIndex)
  return (
    ASCENSION_STEPS.find(
      (step) => progressionIndex(ASCENSION_STEP_PROGRESSION[step]) > held
    ) ?? "fullyAscended"
  )
}

/** The first ascension step a shard count has not completed yet, or every step reached. */
export type AscensionGoal =
  | {
      step: AscensionStep
      /** Cumulative shards that complete the step. */
      threshold: number
      /** Shards held beyond the previous step. */
      shardsTowardStep: number
      /** Shards this step takes on its own. */
      stepSize: number
    }
  | { step: "fullyAscended" }

/**
 * The first cumulative ascension threshold above `shards`, counted from `fromStep` (the unit's next
 * step, `unitNextAscensionStep`; unlock, then + four stars, + five stars, …) (design D2 step 4,
 * D5). Shared by the reward projection and the run forecast so both name steps the same way.
 */
export function nextAscensionStep(
  shards: number,
  progression: LegendaryEventRewards["progression"],
  fromStep: AscensionStep | "fullyAscended"
): AscensionGoal {
  if (fromStep === "fullyAscended") return { step: "fullyAscended" }
  let previous = 0
  for (const step of ASCENSION_STEPS.slice(ASCENSION_STEPS.indexOf(fromStep))) {
    const threshold = previous + progression[step]
    if (threshold > shards) {
      return {
        step,
        threshold,
        shardsTowardStep: Math.max(0, shards - previous),
        stepSize: threshold - previous,
      }
    }
    previous = threshold
  }
  return { step: "fullyAscended" }
}

/**
 * `target`'s cumulative threshold counted from `fromStep` (spec: points target for a chosen
 * ascension step), with the shards held toward it; every step reached when `target` comes before
 * `fromStep` or the shards already cover it.
 */
export function targetAscensionStep(
  shards: number,
  progression: LegendaryEventRewards["progression"],
  fromStep: AscensionStep | "fullyAscended",
  target: AscensionStep
): AscensionGoal {
  if (fromStep === "fullyAscended") return { step: "fullyAscended" }
  const from = ASCENSION_STEPS.indexOf(fromStep)
  const to = ASCENSION_STEPS.indexOf(target)
  if (to < from) return { step: "fullyAscended" }
  let previous = 0
  for (const step of ASCENSION_STEPS.slice(from, to)) {
    previous += progression[step]
  }
  const threshold = previous + progression[target]
  if (threshold <= shards) return { step: "fullyAscended" }
  return {
    step: target,
    threshold,
    shardsTowardStep: Math.max(0, shards - previous),
    stepSize: threshold - previous,
  }
}

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
        | "extraCurrencyPerPayout"
      >
    | undefined
  /** The event's resolved runs (`resolveLegendaryEventRuns`): which runs have not started. */
  resolution: LegendaryEventRunResolution
  /** The event unit's synced roster record; `undefined` when it is not in the roster (Unlock). */
  unit: Pick<LegendaryEventRosterUnit, "progressionIndex"> | undefined
  /** The plan's stored run inputs (absent runs read as zeros). */
  runs: readonly LegendaryEventRunInputs[] | undefined
  showPaidOptions: boolean
  /** The step to project instead of the next one (the 1-click plan's target); a step at or before
   *  the unit's synced progression reads as every step reached. */
  targetStep?: AscensionStep
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
  /** The run in progress, else the next run (`currentLegendaryEventRun`; 1 when unknown). */
  currentRun: LegendaryEventRun
  /** The unit's next step the goal is counted from. */
  fromStep: AscensionStep | "fullyAscended"
  /** Whether the account has a synced entry for the event. */
  synced: boolean
  /** Only future runs' inputs count, in run order. */
  futureRuns: FutureRunContribution[]
  futureCloseShards: number
  /** Added to every points milestone payout (synced `extraCurrencyPerPayout`, or 15 with premium). */
  bonusPerPayout: number
  goal: AscensionGoal
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
/**
 * The runs that have not started (spec: future runs): after the run in progress while one is
 * active, from the next run between runs, all three without a synced entry, none once every run
 * has ended or while the run is unknown.
 */
function futureRunNumbers(
  resolution: LegendaryEventRunResolution,
  synced: boolean
): LegendaryEventRun[] {
  if (resolution.kind === "unknown") return []
  if (resolution.currentRun === null && resolution.nextRun === null) return []
  if (!synced) return [...RUNS]
  if (resolution.currentRun !== null) {
    return RUNS.filter((run) => run > resolution.currentRun!)
  }
  return RUNS.filter((run) => run >= resolution.nextRun!)
}

export function projectRewards({
  rewards,
  progress,
  resolution,
  unit,
  runs,
  showPaidOptions,
  targetStep,
}: RewardProjectionInput): RewardProjection {
  // 1. Base from sync.
  const base = {
    points: progress?.currentPoints ?? 0,
    currency: progress?.currentCurrency ?? 0,
    chestsClaimed: Math.max(0, progress?.currentClaimedChestIndex ?? 0),
    shards: progress?.currentShards ?? 0,
  }
  const currentRun = currentLegendaryEventRun(resolution)
  const fromStep = unitNextAscensionStep(unit)

  // 2–3. Future runs: the runs that have not started (none while the run is unknown).
  const futureRuns = futureRunNumbers(resolution, progress !== undefined).map(
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

  // 7. Per-payout bonus (an unknown run reads no stored inputs, only the synced bonus).
  const syncedBonus = progress?.extraCurrencyPerPayout ?? 0
  const bonusPerPayout =
    syncedBonus > 0
      ? syncedBonus
      : showPaidOptions &&
          resolution.kind === "known" &&
          runInputValues(runs, currentRun).premiumMissions > 0
        ? PREMIUM_BONUS_CURRENCY
        : 0

  const projection: RewardProjection = {
    base,
    currentRun,
    fromStep,
    synced: progress !== undefined,
    futureRuns,
    futureCloseShards,
    bonusPerPayout,
    goal: { step: "fullyAscended" },
    chests: null,
    currency: null,
    points: null,
  }

  // 4. The first cumulative threshold above the shards held plus future close shards, counted from
  // the unit's next step.
  const shards = base.shards + futureCloseShards
  projection.goal = targetStep
    ? targetAscensionStep(shards, rewards.progression, fromStep, targetStep)
    : nextAscensionStep(shards, rewards.progression, fromStep)
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
