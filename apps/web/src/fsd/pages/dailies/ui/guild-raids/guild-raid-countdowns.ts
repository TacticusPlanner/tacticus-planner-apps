// Observation-anchored countdown math for the Guild Raids status page. Every countdown here is
// derived from a fixed observation instant (the API's `observedAt` for the season end, the player-data
// snapshot's `updatedAt` for token/bomb buckets) plus a duration known at that instant — never from a
// live regenerating source. A stale snapshot just reads back "due", never a locally-guessed higher
// token count: `formatRelativeTime` (see @/shared/lib) renders the actual localized copy from the
// `pending` case's `targetMs`.

export type GuildRaidCountdown =
  | { kind: "pending"; targetMs: number }
  | { kind: "due" }
  | { kind: "full" }
  | { kind: "unavailable" }

/** Remaining-season-time countdown, from the API's nullable `endsAt`. */
export function seasonEndCountdown(
  endsAt: string | null,
  nowMs: number
): GuildRaidCountdown {
  if (!endsAt) {
    return { kind: "unavailable" }
  }

  const targetMs = Date.parse(endsAt)
  if (Number.isNaN(targetMs)) {
    return { kind: "unavailable" }
  }

  return targetMs > nowMs ? { kind: "pending", targetMs } : { kind: "due" }
}

export type GuildRaidTokenBucket = {
  current: number
  max: number
  nextTokenInSeconds: number
}

/**
 * Next-token countdown for a raid/bomb token bucket, anchored to the player-data snapshot's
 * observation time rather than the current instant — the bucket's `nextTokenInSeconds` was only ever
 * true as of that snapshot. A full bucket has no next-token countdown to show.
 */
export function resourceCountdown(
  bucket: GuildRaidTokenBucket | null | undefined,
  observedAtMs: number,
  nowMs: number
): GuildRaidCountdown {
  if (!bucket) {
    return { kind: "unavailable" }
  }

  if (bucket.current >= bucket.max) {
    return { kind: "full" }
  }

  if (
    !Number.isFinite(bucket.nextTokenInSeconds) ||
    bucket.nextTokenInSeconds < 0
  ) {
    return { kind: "unavailable" }
  }

  const targetMs = observedAtMs + bucket.nextTokenInSeconds * 1000
  return targetMs > nowMs ? { kind: "pending", targetMs } : { kind: "due" }
}
