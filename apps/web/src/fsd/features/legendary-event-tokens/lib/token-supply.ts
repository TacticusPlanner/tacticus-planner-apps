import {
  LEGENDARY_EVENT_RUN_DURATION_MS,
  runInputValues,
  type LegendaryEvent,
  type LegendaryEventLifecycle,
  type LegendaryEventProgress,
  type LegendaryEventRun,
  type LegendaryEventRunInputs,
  type LegendaryEventRunResolution,
} from "@/entities/legendary-event"

// Ported from V1 `LeTokenService` and `LeRoundOutcomeForecastService` token counts (design D6),
// with V2's lifecycle for the run window and the synced bucket's observation instant for timing.

const DAY_MS = 24 * 60 * 60 * 1000
/** One ad token a day. */
const FULL_RUN_AD_TOKENS = 7
/** Buying the premium track (bonus delivery) for a run grants 6 tokens in that run. */
const BONUS_DELIVERY_TOKENS = 6

/** The event's served token bank, as the supply reads it. */
type LegendaryEventTokenBank = Pick<
  LegendaryEvent["tokens"],
  "start" | "regenSeconds" | "regenAmount"
>

/** A full run starts with the bank's opening tokens and regenerates every tick of the run but the
 *  last (V1: 7 × 8 − 1 ticks of 3 hours plus 6). */
const fullRunFreeTokens = (bank: LegendaryEventTokenBank) =>
  bank.start +
  (Math.floor(LEGENDARY_EVENT_RUN_DURATION_MS / (bank.regenSeconds * 1000)) -
    1) *
    bank.regenAmount

const RUNS: readonly LegendaryEventRun[] = [1, 2, 3]

export type RunSupplyState = "done" | "now" | "next" | "planned"

export interface RunSupply {
  run: LegendaryEventRun
  state: RunSupplyState
  /** True for the one conservative Next run of an unknown run (spec: the unknown state plans one
   *  conservative run): `run` is then only the depth key and is never shown, and no stored run
   *  inputs apply to it. */
  unknownRun: boolean
  free: number
  ad: number
  bonusDelivery: number
  total: number
}

export interface TokenSupplyInput {
  /** The event's served token bank. */
  bank: LegendaryEventTokenBank
  lifecycle: LegendaryEventLifecycle
  /** The event's resolved runs (`resolveLegendaryEventRuns`), not the synced run alone. */
  resolution: LegendaryEventRunResolution
  /** The account's synced entry for the event; `undefined` when it has none. */
  progress:
    | Pick<
        LegendaryEventProgress,
        | "currentEventTokens"
        | "hasUsedAdForExtraTokenToday"
        | "extraCurrencyPerPayout"
      >
    | undefined
  /** When the `lre-progress` chunk was observed; null when unknown (the next token is then now). */
  progressObservedAtMs: number | null
  nowMs: number
  runs: readonly LegendaryEventRunInputs[] | undefined
  showPaidOptions: boolean
}

const premiumPlanned = (
  runs: TokenSupplyInput["runs"],
  run: LegendaryEventRun,
  showPaidOptions: boolean
) => showPaidOptions && runInputValues(runs, run).premiumMissions > 0

function supply(
  run: LegendaryEventRun,
  state: RunSupplyState,
  free: number,
  ad: number,
  bonusDelivery: number,
  unknownRun = false
): RunSupply {
  return {
    run,
    state,
    unknownRun,
    free,
    ad,
    bonusDelivery,
    total: free + ad + bonusDelivery,
  }
}

/** The run that is Now: free tokens from the synced bucket and its regeneration until the run ends,
 *  ad tokens for the days left, and bonus delivery when planned but not yet bought. */
function currentRunSupply(
  run: LegendaryEventRun,
  runEndMs: number,
  input: TokenSupplyInput
): RunSupply {
  const { bank, progress, progressObservedAtMs, nowMs } = input
  const bucket = progress?.currentEventTokens ?? null
  const regenMs =
    (bucket && bucket.regenDelayInSeconds > 0
      ? bucket.regenDelayInSeconds
      : bank.regenSeconds) * 1000
  const nextTokenMs = bucket
    ? (progressObservedAtMs ?? nowMs) +
      Math.max(0, bucket.nextTokenInSeconds) * 1000
    : nowMs
  const free =
    (bucket?.current ?? 0) +
    ((bucket && nextTokenMs < runEndMs ? 1 : 0) +
      Math.max(0, Math.floor((runEndMs - nextTokenMs) / regenMs))) *
      bank.regenAmount
  const remainingMs = runEndMs - nowMs - 1
  const ad =
    remainingMs <= 0
      ? 0
      : Math.floor(remainingMs / DAY_MS) +
        (progress?.hasUsedAdForExtraTokenToday === true ? 0 : 1)
  const alreadyBought = (progress?.extraCurrencyPerPayout ?? 0) > 0
  const bonus =
    premiumPlanned(input.runs, run, input.showPaidOptions) && !alreadyBought
      ? BONUS_DELIVERY_TOKENS
      : 0
  return supply(run, "now", free, ad, bonus)
}

/**
 * Tokens each run 1–3 still supplies (spec: token supply per run) from the resolved runs; null for
 * an archived event or once every run has ended. Active: runs before the run in progress are Done,
 * it is Now and later runs are Planned. Upcoming: the ended runs are Done and the rest Planned, the
 * first of them labelled Next. Unknown run: one Next run of the Planned count, without run inputs.
 */
export function runTokenSupply(input: TokenSupplyInput): RunSupply[] | null {
  const { bank, lifecycle, resolution, runs, showPaidOptions } = input
  if (lifecycle.state === "archived") return null
  const fullRunFree = fullRunFreeTokens(bank)

  const planned = (run: LegendaryEventRun, state: RunSupplyState) =>
    supply(
      run,
      state,
      fullRunFree,
      FULL_RUN_AD_TOKENS,
      premiumPlanned(runs, run, showPaidOptions) ? BONUS_DELIVERY_TOKENS : 0
    )

  if (resolution.kind === "unknown") {
    return [supply(1, "next", fullRunFree, FULL_RUN_AD_TOKENS, 0, true)]
  }

  if (lifecycle.state === "active") {
    const current = resolution.currentRun ?? 1
    return RUNS.map((run) =>
      run < current
        ? supply(run, "done", 0, 0, 0)
        : run === current
          ? currentRunSupply(run, lifecycle.runEndMs, input)
          : planned(run, "planned")
    )
  }

  const { endedRuns, nextRun } = resolution
  if (nextRun === null) return null
  return RUNS.map((run) =>
    run <= endedRuns
      ? supply(run, "done", 0, 0, 0)
      : planned(run, run === nextRun ? "next" : "planned")
  )
}
