import { safeStorage } from "@/shared/lib"

/**
 * Counts Home showed last time on this device, so a loading placeholder can take about the room
 * the loaded content will (a per-device convenience: a wrong guess only costs a small shift).
 */
export const homeRememberedCounts = {
  /** Live events in Right now; before the first count, two tiles. */
  liveEvents: { key: "home-live-event-count", fallback: 2, max: 6 },
  /** Token rings in Right now; before the first count, the one-line loading text (a device that
   *  has never synced shows a one-line empty state, and must not shrink from a row of rings). */
  tokens: { key: "home-token-count", fallback: 0, max: 5 },
} as const

type RememberedCount =
  (typeof homeRememberedCounts)[keyof typeof homeRememberedCounts]

export function rememberedCount({ key, fallback, max }: RememberedCount) {
  const raw = safeStorage.get(key)
  if (raw === null || raw.trim() === "") return fallback
  const stored = Number(raw)
  return Number.isInteger(stored) && stored >= 0 && stored <= max
    ? stored
    : fallback
}

export function rememberCount({ key, max }: RememberedCount, count: number) {
  safeStorage.set(key, String(Math.min(count, max)))
}
