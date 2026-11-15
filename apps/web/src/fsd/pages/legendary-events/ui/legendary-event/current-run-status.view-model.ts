import type {
  AscensionStep,
  LegendaryEventRun,
} from "@/entities/legendary-event"
import {
  currentRunOutlook,
  type TokenPlanView,
} from "@/features/legendary-event-tokens"

import type { RunStatusViewModel } from "./legendary-event-page.view-model"

type Synced = Extract<RunStatusViewModel, { kind: "synced" }>

/** One resource on the run tab's Run status: now, and at the end of the run when forecast. */
export interface RunStatusRow {
  key: "points" | "currency" | "chests" | "shards"
  now: number
  /** Null without a forecast. */
  end: number | null
  /** What the run adds (currency counts what it earns, before chests spend it); null without a
   *  forecast or when it adds nothing. */
  gain: number | null
}

/** The character step line: reached this run (at a token), or still short by the run's end. */
export type RunStatusGoal =
  | {
      kind: "thisRun"
      step: AscensionStep
      token: number
      /** The step after it at the run's end; null once every step is reached. */
      then: { step: AscensionStep; shardsShort: number } | null
    }
  | {
      kind: "later"
      step: AscensionStep
      shardsShort: number
      /** The planned token that reaches it in a later run; null when none does. */
      at: { token: number; run: LegendaryEventRun } | null
    }
  | { kind: "allSteps" }

/**
 * The run tab's Run status (spec: Run status on the run tab): every fact once. The synced values
 * and the forecast for the end of the run share one table; the plan's next character step is one
 * line. Without a forecast the table has only the Now column and there is no step line.
 */
export interface CurrentRunStatusModel {
  run: number | null
  tokens: Synced["tokens"]
  /** The run's token supply (in hand plus those still to come); null without a forecast. */
  tokensLeft: number | null
  /** Of `tokensLeft`, the ad tokens and bonus delivery tokens (0 without a forecast). */
  fromAds: number
  bonusDelivery: number
  /** Run tokens the plan has nothing to play with. */
  unused: number
  adTodayPending: boolean
  /** The run the End column is for; `unknown` for the one Next block of an unknown run. */
  endRun: { run: LegendaryEventRun; unknown: boolean } | null
  rows: RunStatusRow[]
  milestone: Synced["milestone"]
  goal: RunStatusGoal | null
  ohSoClose: { shards: number; blackstone: number } | null
}

export function buildCurrentRunStatusModel(
  runStatus: Synced,
  view: TokenPlanView
): CurrentRunStatusModel {
  const outlook = currentRunOutlook(view)
  const run = outlook?.run ?? null
  const row = (
    key: RunStatusRow["key"],
    now: number,
    end: number | undefined,
    gain: number | undefined
  ): RunStatusRow => ({
    key,
    now,
    end: end ?? null,
    gain: gain === undefined || gain <= 0 ? null : gain,
  })
  return {
    run: runStatus.run,
    tokens: runStatus.tokens,
    tokensLeft: run?.supply.total ?? null,
    fromAds: run?.supply.ad ?? 0,
    bonusDelivery: run?.supply.bonusDelivery ?? 0,
    unused: run && run.tokensUsed > 0 ? run.tokensLeftOver : 0,
    adTodayPending: run?.supply.adTodayPending ?? false,
    endRun: run ? { run: run.run, unknown: run.supply.unknownRun } : null,
    rows: [
      row("points", runStatus.points, run?.endingPoints, run?.pointsEarned),
      row(
        "currency",
        runStatus.currency,
        run?.endingCurrency,
        run?.currencyEarned
      ),
      row(
        "chests",
        runStatus.chestsClaimed,
        run?.chestsClaimed,
        run?.chestsOpened
      ),
      row(
        "shards",
        runStatus.shards,
        run?.endingShards,
        run ? run.endingShards - runStatus.shards : undefined
      ),
    ],
    milestone: runStatus.milestone,
    goal: outlook ? goalOf(outlook) : null,
    ohSoClose: run?.ohSoClose ?? null,
  }
}

function goalOf(
  outlook: NonNullable<ReturnType<typeof currentRunOutlook>>
): RunStatusGoal {
  const { run, nextStep } = outlook
  const then =
    run.next.step === "fullyAscended"
      ? null
      : { step: run.next.step, shardsShort: run.shardsMissing }
  if (nextStep && nextStep.run === run.run) {
    return { kind: "thisRun", step: nextStep.step, token: nextStep.token, then }
  }
  if (!then) return { kind: "allSteps" }
  return {
    kind: "later",
    step: then.step,
    shardsShort: then.shardsShort,
    at:
      nextStep && nextStep.step === then.step
        ? { token: nextStep.token, run: nextStep.run }
        : null,
  }
}
