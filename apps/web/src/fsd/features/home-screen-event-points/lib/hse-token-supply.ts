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
      endMs: number
      /** When the buckets were synced (their `nextTokenInSeconds` counts from here). */
      observedAtMs: number
    }
  | { status: "upcoming"; startMs: number; endMs: number }

const floorPositive = (value: number) => Math.max(0, Math.floor(value))

/**
 * Tokens one bucket supplies until the event ends (design D3, after the LRE `token-supply.ts`).
 * Running: what is in the bucket, the next token if it lands before the end, then one per regeneration
 * delay (assumes the player spends before the bucket caps). Upcoming: a full bucket at the start plus
 * one per delay over the event.
 */
export function hseBucketTokens(
  bucket: HseTokenBucket,
  window: HseTokenWindow
): number {
  const regenMs = bucket.regenDelayInSeconds * 1000
  if (window.status === "upcoming") {
    const regenerated =
      regenMs > 0 ? floorPositive((window.endMs - window.startMs) / regenMs) : 0
    return bucket.max + regenerated
  }
  const nextMs =
    window.observedAtMs + Math.max(0, bucket.nextTokenInSeconds) * 1000
  const next = nextMs < window.endMs ? 1 : 0
  const regenerated =
    regenMs > 0 ? floorPositive((window.endMs - nextMs) / regenMs) : 0
  return bucket.current + next + regenerated
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
