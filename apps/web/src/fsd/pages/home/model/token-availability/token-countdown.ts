export type TokenCountdown =
  | { kind: "pending"; targetMs: number }
  | { kind: "due" }
  | { kind: "full" }
  | { kind: "unavailable" }

export type TokenBucketData = {
  current: number
  max: number
  nextTokenInSeconds: number
  /** Seconds between tokens; with it the bucket's full-at time can be shown. */
  regenDelayInSeconds?: number
}

/**
 * Next-token countdown for a token bucket, anchored to the player-data snapshot's observation
 * time (`observedAtMs`) rather than the current instant — `nextTokenInSeconds` was only ever true
 * as of that snapshot, so this never projects multiple regenerated tokens ahead of what was
 * actually synced. Mirrors `pages/dailies/ui/guild-raids/guild-raid-countdowns.ts`'s
 * `resourceCountdown` (not imported directly — that file is page-local to `pages/dailies`, and
 * this widget lives in `pages/home`; the logic is small enough that duplicating it beats a
 * premature shared slice for two consumers).
 */
export function tokenCountdown(
  bucket: TokenBucketData | null | undefined,
  observedAtMs: number,
  nowMs: number
): TokenCountdown {
  if (!bucket) return { kind: "unavailable" }
  if (bucket.current >= bucket.max) return { kind: "full" }
  if (
    !Number.isFinite(bucket.nextTokenInSeconds) ||
    bucket.nextTokenInSeconds < 0
  ) {
    return { kind: "unavailable" }
  }

  const targetMs = observedAtMs + bucket.nextTokenInSeconds * 1000
  return targetMs > nowMs ? { kind: "pending", targetMs } : { kind: "due" }
}

/** How full a bucket is, 0–100, for its ring (an over-cap bucket reads as full). */
export function tokenFillPercent(bucket: TokenBucketData): number {
  if (bucket.max <= 0) return 0
  return Math.round(
    (Math.min(Math.max(bucket.current, 0), bucket.max) / bucket.max) * 100
  )
}

/** Capped buckets first, so wasted regeneration is the first thing seen; otherwise the given order. */
export function cappedFirst<T extends { bucket: TokenBucketData }>(
  entries: readonly T[]
): T[] {
  const isCapped = (entry: T) => entry.bucket.current >= entry.bucket.max
  return [...entries.filter(isCapped), ...entries.filter((e) => !isCapped(e))]
}

/**
 * When the bucket is full, anchored like `tokenCountdown` to the snapshot: the next token arrives
 * after `nextTokenInSeconds`, each later one after another `regenDelayInSeconds`. `undefined` when
 * already full or the regen data is missing. E.g. Guild Raid 1/3, next in 0:49:20 (2,960 s),
 * 43,200 s per token: 2,960 + (3 − 1 − 1) × 43,200 = 46,160 s ≈ full in 12h 49m.
 */
export function tokenFullAtMs(
  bucket: TokenBucketData,
  observedAtMs: number
): number | undefined {
  const missing = bucket.max - bucket.current
  const regen = bucket.regenDelayInSeconds
  if (missing <= 0 || regen === undefined || !(regen > 0)) return undefined
  if (
    !Number.isFinite(bucket.nextTokenInSeconds) ||
    bucket.nextTokenInSeconds < 0
  ) {
    return undefined
  }
  return (
    observedAtMs + (bucket.nextTokenInSeconds + (missing - 1) * regen) * 1000
  )
}
