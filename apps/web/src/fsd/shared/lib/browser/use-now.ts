import { useSyncExternalStore } from "react"

/**
 * App-wide clocks for render-time "now": one interval per tick length, shared by every subscriber,
 * running only while something subscribes and the tab is visible. A hidden tab (another tab in
 * front, the window minimized) stops every clock; showing it again publishes the current instant at
 * once and restarts them, so countdowns and event boundaries catch up without a reload.
 */
type Clock = {
  nowMs: number
  timer: number | undefined
  listeners: Set<() => void>
  subscribe: (listener: () => void) => () => void
}

const clocks = new Map<number, Clock>()
let subscriberCount = 0

const isPageHidden = () => document.visibilityState === "hidden"

function publish(clock: Clock) {
  clock.nowMs = Date.now()
  clock.listeners.forEach((notify) => notify())
}

function start(clock: Clock, intervalMs: number) {
  if (clock.timer !== undefined || isPageHidden()) return
  clock.timer = window.setInterval(() => publish(clock), intervalMs)
}

function stop(clock: Clock) {
  window.clearInterval(clock.timer)
  clock.timer = undefined
}

function onVisibilityChange() {
  const hidden = isPageHidden()
  for (const [intervalMs, clock] of clocks) {
    if (clock.listeners.size === 0) continue
    if (hidden) {
      stop(clock)
    } else {
      publish(clock)
      start(clock, intervalMs)
    }
  }
}

function clockFor(intervalMs: number): Clock {
  const existing = clocks.get(intervalMs)
  if (existing) return existing
  const clock: Clock = {
    nowMs: Date.now(),
    timer: undefined,
    listeners: new Set(),
    subscribe: (listener) => {
      clock.listeners.add(listener)
      subscriberCount += 1
      if (subscriberCount === 1) {
        document.addEventListener("visibilitychange", onVisibilityChange)
      }
      start(clock, intervalMs)
      return () => {
        clock.listeners.delete(listener)
        subscriberCount -= 1
        if (subscriberCount === 0) {
          document.removeEventListener("visibilitychange", onVisibilityChange)
        }
        if (clock.listeners.size === 0) stop(clock)
      }
    },
  }
  clocks.set(intervalMs, clock)
  return clock
}

/** The clock's current instant. A stopped clock (no subscriber, or a hidden tab) catches up with
 *  the time so a fresh mount starts from now; the 1 s slack keeps repeated reads within one render
 *  identical. */
export function readNow(intervalMs: number): number {
  const clock = clockFor(intervalMs)
  if (clock.timer === undefined && Math.abs(Date.now() - clock.nowMs) >= 1000) {
    clock.nowMs = Date.now()
  }
  return clock.nowMs
}

/**
 * The current instant, refreshed every `intervalMs` while the tab is visible (render stays pure:
 * callers read the returned value, never `Date.now()`). With `select` the host re-renders only when
 * the selected value changes (compared with `Object.is`, so return a primitive).
 */
export function useNow(intervalMs: number): number
export function useNow<T>(intervalMs: number, select: (nowMs: number) => T): T
export function useNow<T>(
  intervalMs: number,
  select?: (nowMs: number) => T
): T | number {
  return useSyncExternalStore<T | number>(
    clockFor(intervalMs).subscribe,
    select ? () => select(readNow(intervalMs)) : () => readNow(intervalMs)
  )
}
