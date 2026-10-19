import {
  ASCENSION_STEPS,
  BUNDLE_CURRENCY,
  EMPTY_RUN_INPUT_VALUES,
  MAX_CLOSE_SHARDS,
  MISSION_CURRENCY,
  PREMIUM_BONUS_CURRENCY,
  nextAscensionStep,
  runInputValues,
  type AscensionGoal,
  type AscensionStep,
  type LegendaryEventProgress,
  type LegendaryEventRewards,
  type LegendaryEventRun,
  type LegendaryEventRunInputs,
} from "@/entities/legendary-event"

import type { PlannedToken } from "./token-plan"
import { splitPlanByRun } from "./token-runs"
import type { RunSupply, RunSupplyState } from "./token-supply"

// Ported from V1 `LeRoundOutcomeForecastService.computeLeRoundForecasts` and the per-token
// milestone markers of `TokenEstimationService.getTokenDisplays` (design D6), reading the event's
// own ladder and Stage 3's input semantics (design D3 f, g).

/** "Oh So Close" price: 500 blackstone plus 100 per shard for Unlock, 50 for later steps (V1). */
const OH_SO_CLOSE_BASE_COST = 500
const OH_SO_CLOSE_UNLOCK_COST_PER_SHARD = 100
const OH_SO_CLOSE_PROMOTION_COST_PER_SHARD = 50

export interface ForecastInput {
  rewards: LegendaryEventRewards
  /** The account's synced entry; `undefined` starts from zero. */
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
  supply: readonly RunSupply[]
  /** The event unit's next step (`unitNextAscensionStep`), shared with the reward projection so
   *  both count the shards from the same step. */
  fromStep: AscensionStep | "fullyAscended"
  tokens: readonly Pick<PlannedToken, "points">[]
  runs: readonly LegendaryEventRunInputs[] | undefined
  showPaidOptions: boolean
}

export interface OhSoCloseHint {
  shards: number
  blackstone: number
}

export interface RunForecast {
  run: LegendaryEventRun
  state: RunSupplyState
  supply: RunSupply
  tokensUsed: number
  tokensLeftOver: number
  pointsEarned: number
  endingPoints: number
  /** Points payouts (with the run's bonus) plus, for later runs, missions and the bundle. */
  currencyEarned: number
  missionCurrency: number
  bundleCurrency: number
  endingCurrency: number
  chestsOpened: number
  chestsClaimed: number
  endingShards: number
  stepsReached: AscensionStep[]
  next: AscensionGoal
  /** Shards still missing for `next` (0 when every step is reached). */
  shardsMissing: number
  ohSoClose: OhSoCloseHint | null
}

/** What a planned token crosses: points milestones paid and ascension steps reached. */
export interface TokenMarker {
  milestones: { milestone: number; payout: number }[]
  steps: AscensionStep[]
}

export interface Forecast {
  runs: RunForecast[]
  /** One per planned token, in plan order; tokens beyond the supply carry none. */
  markers: TokenMarker[]
}

/** The blackstone price of closing a gap of `shards` with Oh So Close, or null when not offered. */
export function ohSoCloseHint(
  goal: AscensionGoal,
  shards: number
): OhSoCloseHint | null {
  if (goal.step === "fullyAscended") return null
  const missing = goal.threshold - shards
  if (missing <= 0 || missing > MAX_CLOSE_SHARDS) return null
  const perShard =
    goal.step === "unlock"
      ? OH_SO_CLOSE_UNLOCK_COST_PER_SHARD
      : OH_SO_CLOSE_PROMOTION_COST_PER_SHARD
  return {
    shards: missing,
    blackstone: OH_SO_CLOSE_BASE_COST + perShard * missing,
  }
}

const stepIndex = (goal: AscensionGoal, steps: readonly AscensionStep[]) =>
  goal.step === "fullyAscended" ? steps.length : steps.indexOf(goal.step)

/**
 * Spends the plan's tokens run by run and carries points, currency, chests and shards (spec:
 * run-by-run forecast from the token plan). Done runs carry the synced base unchanged.
 */
export function forecastRuns({
  rewards,
  progress,
  supply,
  fromStep,
  tokens,
  runs,
  showPaidOptions,
}: ForecastInput): Forecast {
  const chests = [...rewards.chestsMilestones].sort(
    (a, b) => a.chestLevel - b.chestLevel
  )
  const milestones = [...rewards.pointsMilestones].sort(
    (a, b) => a.cumulativePoints - b.cumulativePoints
  )
  const stepOrder = ASCENSION_STEPS

  let points = progress?.currentPoints ?? 0
  let currency = progress?.currentCurrency ?? 0
  let claimed = Math.max(0, progress?.currentClaimedChestIndex ?? 0)
  let shards = progress?.currentShards ?? 0
  let tokenIndex = 0
  const markers: TokenMarker[] = tokens.map(() => ({
    milestones: [],
    steps: [],
  }))

  /** Opens every chest the currency covers; returns the steps newly reached. */
  const openChests = (): { opened: number; steps: AscensionStep[] } => {
    const before = nextAscensionStep(shards, rewards.progression, fromStep)
    let opened = 0
    for (;;) {
      const chest = chests[claimed]
      if (!chest || chest.engramCost > currency) break
      currency -= chest.engramCost
      claimed += 1
      shards += rewards.shardsPerChest
      opened += 1
    }
    return { opened, steps: stepsBetween(before) }
  }

  const stepsBetween = (before: AscensionGoal): AscensionStep[] => {
    const after = nextAscensionStep(shards, rewards.progression, fromStep)
    return stepOrder.slice(
      stepIndex(before, stepOrder),
      stepIndex(after, stepOrder)
    )
  }

  const tokensByRun = new Map(
    splitPlanByRun(tokens.length, supply).sections.map((section) => [
      section.run,
      section.count,
    ])
  )

  const results = supply.map((runSupply): RunForecast => {
    const startPoints = points
    const startCurrency = currency
    const startClaimed = claimed
    const startShards = shards
    const startGoal = nextAscensionStep(shards, rewards.progression, fromStep)
    let missionCurrency = 0
    let bundleCurrency = 0
    let used = 0

    if (runSupply.state !== "done") {
      // An unknown run's one Next block reads no stored inputs (spec: the unknown state).
      const values = runSupply.unknownRun
        ? EMPTY_RUN_INPUT_VALUES
        : runInputValues(runs, runSupply.run)
      const premium = showPaidOptions ? values.premiumMissions : 0
      const isNow = runSupply.state === "now"
      const syncedBonus = progress?.extraCurrencyPerPayout ?? 0
      const bonus =
        isNow && syncedBonus > 0
          ? syncedBonus
          : premium > 0
            ? PREMIUM_BONUS_CURRENCY
            : 0

      // Later runs' missions, bundle and Oh So Close shards; the current run's are in sync.
      if (!isNow) {
        const premiumBonus = premium > 0 ? PREMIUM_BONUS_CURRENCY : 0
        missionCurrency =
          (values.regularMissions + premium) * (MISSION_CURRENCY + premiumBonus)
        bundleCurrency =
          showPaidOptions && values.bundlePurchased
            ? BUNDLE_CURRENCY + premiumBonus
            : 0
        currency += missionCurrency + bundleCurrency
        shards += showPaidOptions ? values.closeShards : 0
      }
      // Synced currency can already cover a chest the game has not opened yet.
      openChests()

      used = tokensByRun.get(runSupply.run) ?? 0
      for (let index = tokenIndex; index < tokenIndex + used; index++) {
        const before = points
        points += tokens[index]!.points
        const crossed = milestones.filter(
          (entry) =>
            entry.cumulativePoints > before && entry.cumulativePoints <= points
        )
        if (crossed.length === 0) continue
        for (const entry of crossed) {
          currency += entry.engramPayout + bonus
          markers[index]!.milestones.push({
            milestone: entry.milestone,
            payout: entry.engramPayout + bonus,
          })
        }
        markers[index]!.steps.push(...openChests().steps)
      }
      tokenIndex += used
    }

    const next = nextAscensionStep(shards, rewards.progression, fromStep)
    return {
      run: runSupply.run,
      state: runSupply.state,
      supply: runSupply,
      tokensUsed: used,
      tokensLeftOver: runSupply.state === "done" ? 0 : runSupply.total - used,
      pointsEarned: points - startPoints,
      endingPoints: points,
      currencyEarned:
        currency -
        startCurrency +
        chestCostBetween(chests, startClaimed, claimed),
      missionCurrency,
      bundleCurrency,
      endingCurrency: currency,
      chestsOpened: claimed - startClaimed,
      chestsClaimed: claimed,
      endingShards: shards,
      stepsReached:
        shards === startShards
          ? []
          : stepOrder.slice(
              stepIndex(startGoal, stepOrder),
              stepIndex(next, stepOrder)
            ),
      next,
      shardsMissing:
        next.step === "fullyAscended" ? 0 : next.threshold - shards,
      ohSoClose:
        runSupply.state === "done" ? null : ohSoCloseHint(next, shards),
    }
  })

  return { runs: results, markers }
}

function chestCostBetween(
  chests: readonly { engramCost: number }[],
  fromClaimed: number,
  toClaimed: number
): number {
  return chests
    .slice(fromClaimed, toClaimed)
    .reduce((sum, chest) => sum + chest.engramCost, 0)
}
