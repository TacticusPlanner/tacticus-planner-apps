export type TokenCountdown =
  | { kind: "pending"; targetMs: number }
  | { kind: "due" }
  | { kind: "full" }
  | { kind: "unavailable" }

export type TokenBucketData = {
  current: number
  max: number
  nextTokenInSeconds: number
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
