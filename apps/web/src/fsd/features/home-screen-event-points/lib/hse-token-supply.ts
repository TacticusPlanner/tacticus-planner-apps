/** The token game modes a Home Screen Event projection covers, by their catalog names. */
export const HSE_TOKEN_MODES = ["Arena", "Onslaught", "SalvageRun"] as const
export type HseTokenMode = (typeof HSE_TOKEN_MODES)[number]

/** A synced token bucket (`gameModeTokens.*`): seconds are relative to the instant it was synced. */
export type HseTokenBucket = {
  current: number
  max: number
  nextTokenInSeconds: number
  regenDelayInSeconds: number
}

/** The synced buckets by mode; null when the mode is not unlocked. */
export type HseTokenBuckets = Record<HseTokenMode, HseTokenBucket | null>

export type HseTokenWindow =
  | {
      status: "running"
      startMs: number
      endMs: number
      /** When the buckets were synced (their `nextTokenInSeconds` counts from here). */
      observedAtMs: number
    }
  | { status: "upcoming"; startMs: number; endMs: number }

const floorPositive = (value: number) => Math.max(0, Math.floor(value))

/** Tokens that land before `endMs` when the first lands at `nextMs` and then one per `regenMs`. */
function arrivalsBefore(nextMs: number, endMs: number, regenMs: number) {
  if (nextMs >= endMs) return 0
  return 1 + (regenMs > 0 ? floorPositive((endMs - nextMs) / regenMs) : 0)
}

/**
 * Tokens one bucket supplies until the event ends (design D3, after the LRE `token-supply.ts`).
 * Running: what is in the bucket, the next token if it lands before the end, then one per regeneration
 * delay (assumes the player spends before the bucket caps). A bucket synced before the event started
 * is first rolled forward to the start, capped at its max. A full bucket (`current >= max`) has no
 * countdown (the API then reports `nextTokenInSeconds` 0), so its next token is one regeneration after
 * it is first spent. Upcoming: a full bucket at the start plus one per delay over the event.
 */
export function hseBucketTokens(
  bucket: HseTokenBucket,
  window: HseTokenWindow
): number {
  const regenMs = bucket.regenDelayInSeconds * 1000
  const { startMs, endMs } = window
  if (window.status === "upcoming") {
    const regenerated =
      regenMs > 0 ? floorPositive((endMs - startMs) / regenMs) : 0
    return bucket.max + regenerated
  }

  const { observedAtMs } = window
  // When regeneration counts from: the sync, or the start for a sync before the event.
  let fromMs = observedAtMs
  let held = bucket.current
  let nextMs: number | null =
    bucket.current >= bucket.max
      ? null
      : observedAtMs + Math.max(0, bucket.nextTokenInSeconds) * 1000
  if (observedAtMs < startMs) {
    fromMs = startMs
    if (nextMs !== null) {
      const arrived = arrivalsBefore(nextMs, startMs, regenMs)
      held = Math.min(bucket.max, bucket.current + arrived)
      if (held >= bucket.max) nextMs = null
      else if (arrived > 0) nextMs = nextMs + arrived * regenMs
    }
  }
  // A full bucket stops regenerating; spending it at `fromMs` restarts the countdown.
  const first = nextMs ?? (regenMs > 0 ? fromMs + regenMs : endMs)
  return held + arrivalsBefore(first, endMs, regenMs)
}

/** Tokens per token mode until the event ends; null for a mode that is not unlocked. */
export function hseTokenSupply(
  buckets: HseTokenBuckets,
  window: HseTokenWindow
): Record<HseTokenMode, number | null> {
  const supply = {} as Record<HseTokenMode, number | null>
  for (const mode of HSE_TOKEN_MODES) {
    const bucket = buckets[mode]
    supply[mode] = bucket ? hseBucketTokens(bucket, window) : null
  }
  return supply
}
