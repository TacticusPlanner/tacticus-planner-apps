// A background sync is due once the last successful sync is more than an hour old: "sync at most
// hourly, but always up to date within an hour". PlayerDataProvider gates its auto-sync on it, and
// the Sync controls show progress towards it, so both read the same interval.
export const autoSyncIntervalMs = 60 * 60 * 1000

// How often the provider re-checks whether a sync is due while the app stays open. The actual auto
// sync therefore fires up to this long after `autoSyncIntervalMs` has elapsed.
export const autoSyncCheckIntervalMs = 5 * 60 * 1000

export type AutoSyncProgress = {
  /** Share of the interval elapsed since the last sync, clamped to 0–1 (1 = a sync is due). */
  fraction: number
  /** When the next background sync becomes due, in epoch ms. */
  nextSyncAt: number
}

/**
 * Where the account is in the auto-sync interval, or null when there is no last sync to count from
 * (never synced, or an unparsable timestamp).
 */
export function getAutoSyncProgress(
  lastSyncedAt: string | null,
  now: number
): AutoSyncProgress | null {
  if (!lastSyncedAt) {
    return null
  }

  const lastSynced = Date.parse(lastSyncedAt)
  if (Number.isNaN(lastSynced)) {
    return null
  }

  const elapsed = now - lastSynced

  return {
    fraction: Math.min(Math.max(elapsed / autoSyncIntervalMs, 0), 1),
    nextSyncAt: lastSynced + autoSyncIntervalMs,
  }
}
