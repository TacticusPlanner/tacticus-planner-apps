import {
  currentLegendaryEventRun,
  runInputValues,
  type LegendaryEventLifecycle,
  type LegendaryEventProgress,
  type LegendaryEventRun,
  type LegendaryEventRunInputs,
} from "@/entities/legendary-event"

// Ported from V1 `LeTokenService` and `LeRoundOutcomeForecastService` token counts (design D6),
// with V2's lifecycle for the run window and the synced bucket's observation instant for timing.

const HOUR_MS = 60 * 60 * 1000
const DAY_MS = 24 * HOUR_MS
/** A full run regenerates one token every 3 hours for 7 days (7 × 8 − 1) plus 6 extra. */
const FULL_RUN_FREE_TOKENS = 7 * 8 - 1 + 6
/** One ad token a day. */
const FULL_RUN_AD_TOKENS = 7
/** Buying the premium track (bonus delivery) for a run grants 6 tokens in that run. */
const BONUS_DELIVERY_TOKENS = 6
/** V1's regeneration delay when the bucket is unknown. */
const DEFAULT_REGEN_DELAY_SECONDS = 3 * 60 * 60

const RUNS: readonly LegendaryEventRun[] = [1, 2, 3]

export type RunSupplyState = "done" | "now" | "next" | "planned"

export interface RunSupply {
  run: LegendaryEventRun
  state: RunSupplyState
  free: number
  ad: number
  bonusDelivery: number
  total: number
}

export interface TokenSupplyInput {
  lifecycle: LegendaryEventLifecycle
  /** The account's synced entry for the event; `undefined` when it has none. */
  progress:
    | Pick<
        LegendaryEventProgress,
        | "currentEventRun"
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
  bonusDelivery: number
): RunSupply {
  return {
    run,
    state,
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
  const { progress, progressObservedAtMs, nowMs } = input
  const bucket = progress?.currentEventTokens ?? null
  const regenMs =
    (bucket && bucket.regenDelayInSeconds > 0
      ? bucket.regenDelayInSeconds
      : DEFAULT_REGEN_DELAY_SECONDS) * 1000
  const nextTokenMs = bucket
    ? (progressObservedAtMs ?? nowMs) +
      Math.max(0, bucket.nextTokenInSeconds) * 1000
    : nowMs
  const free =
    (bucket?.current ?? 0) +
    (bucket && nextTokenMs < runEndMs ? 1 : 0) +
    Math.max(0, Math.floor((runEndMs - nextTokenMs) / regenMs))
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
 * Tokens each run 1–3 still supplies (spec: token supply per run); null for an archived event.
 * Active: runs before the synced run are Done, the synced run is Now, later runs are Planned.
 * Upcoming: runs up to the synced `currentEventRun` are Done and the rest Planned, the first of
 * them labelled Next.
 */
export function runTokenSupply(input: TokenSupplyInput): RunSupply[] | null {
  const { lifecycle, progress, runs, showPaidOptions } = input
  if (lifecycle.state === "archived") return null

  const planned = (run: LegendaryEventRun, state: RunSupplyState) =>
    supply(
      run,
      state,
      FULL_RUN_FREE_TOKENS,
      FULL_RUN_AD_TOKENS,
      premiumPlanned(runs, run, showPaidOptions) ? BONUS_DELIVERY_TOKENS : 0
    )

  if (lifecycle.state === "active") {
    const current = currentLegendaryEventRun(progress)
    return RUNS.map((run) =>
      run < current
        ? supply(run, "done", 0, 0, 0)
        : run === current
          ? currentRunSupply(run, lifecycle.runEndMs, input)
          : planned(run, "planned")
    )
  }

  const lastEnded =
    progress && typeof progress.currentEventRun === "number"
      ? currentLegendaryEventRun(progress)
      : 0
  return RUNS.map((run) =>
    run <= lastEnded
      ? supply(run, "done", 0, 0, 0)
      : planned(run, run === lastEnded + 1 ? "next" : "planned")
  )
}
