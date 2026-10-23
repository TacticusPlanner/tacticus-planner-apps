import { useSyncExternalStore } from "react"

const MINUTE_MS = 60_000

// One app-wide ticker: the interval runs while anything subscribes and stops with the last one.
let nowMs = Date.now()
let timer: number | undefined
const listeners = new Set<() => void>()

function subscribe(listener: () => void): () => void {
  listeners.add(listener)
  timer ??= window.setInterval(() => {
    nowMs = Date.now()
    listeners.forEach((notify) => notify())
  }, MINUTE_MS)
  return () => {
    listeners.delete(listener)
    if (listeners.size > 0) return
    window.clearInterval(timer)
    timer = undefined
  }
}

/** The ticker's current instant. Idle (no subscriber), it catches up with the clock so a fresh
 *  mount starts from now; the 1 s slack keeps repeated reads within one render identical. */
export function readMinuteNow(): number {
  if (timer === undefined && Math.abs(Date.now() - nowMs) >= 1000) {
    nowMs = Date.now()
  }
  return nowMs
}

/**
 * The current instant, refreshed once a minute so lifecycle and countdowns re-evaluate while a
 * page stays open (render stays pure: callers read `nowMs`, never `Date.now()`). With `select`
 * the host re-renders only when the selected value changes (compared with `Object.is`, so return
 * a primitive such as a signature string).
 */
export function useMinuteNow(): number
export function useMinuteNow<T>(select: (nowMs: number) => T): T
export function useMinuteNow<T>(select?: (nowMs: number) => T): T | number {
  return useSyncExternalStore<T | number>(
    subscribe,
    select ? () => select(readMinuteNow()) : readMinuteNow
  )
}
