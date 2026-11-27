import { readNow, useNow, MINUTE_MS } from "@/shared/lib"

/** The minute clock's current instant (see `readNow`): stopped, it catches up with the time. */
export function readMinuteNow(): number {
  return readNow(MINUTE_MS)
}

/**
 * The current instant, refreshed once a minute so lifecycle and countdowns re-evaluate while a
 * page stays open (render stays pure: callers read `nowMs`, never `Date.now()`). The shared clock
 * pauses while the tab is hidden and catches up when it is shown. With `select` the host
 * re-renders only when the selected value changes (compared with `Object.is`, so return a
 * primitive such as a signature string).
 */
export function useMinuteNow(): number
export function useMinuteNow<T>(select: (nowMs: number) => T): T
export function useMinuteNow<T>(select?: (nowMs: number) => T): T | number {
  return useNow<T | number>(MINUTE_MS, select ?? ((nowMs) => nowMs))
}
