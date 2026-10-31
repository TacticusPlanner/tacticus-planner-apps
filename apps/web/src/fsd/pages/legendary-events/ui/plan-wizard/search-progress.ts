import type { RecommendUpgradesStep } from "./plan-upgrades"

/** How often the progress bar may re-render while the search runs. */
export const SEARCH_PROGRESS_THROTTLE_MS = 250
/** Below this share of the search, the time left is not estimated (too little to go on). */
const MIN_ESTIMATE_FRACTION = 0.03

/** How far the upgrade search is (spec: the search shows its progress). */
export interface SearchProgress {
  /** 0..1 through the search's rounds, counting the cap. */
  fraction: number
  /** The round being searched (1-based): the upgrade being looked for. */
  round: number
  /** The most upgrades the search looks for. */
  cap: number
  /** Estimated time left at the current pace; null until there is enough to go on. */
  remainingMs: number | null
}

/** A store the progress bar subscribes to, so the search's many steps re-render only the bar,
 *  and at most once per `SEARCH_PROGRESS_THROTTLE_MS`. */
export interface SearchProgressStore {
  subscribe: (listener: () => void) => () => void
  get: () => SearchProgress | null
}

export interface SearchProgressTracker extends SearchProgressStore {
  /** A new search started (progress back to 0). */
  start: (nowMs: number) => void
  /** A step of the search; round steps are ignored. */
  report: (step: RecommendUpgradesStep, nowMs: number) => void
  /** The search ended or was cancelled. */
  stop: () => void
}

/** The estimated time left: the elapsed time scaled by the share still to go. Since the search
 *  can stop before its cap, it is an upper bound. */
export function estimateRemainingMs(
  fraction: number,
  elapsedMs: number
): number | null {
  if (fraction < MIN_ESTIMATE_FRACTION || fraction >= 1) return null
  return (elapsedMs / fraction) * (1 - fraction)
}

export function createSearchProgressTracker(
  throttleMs = SEARCH_PROGRESS_THROTTLE_MS
): SearchProgressTracker {
  const listeners = new Set<() => void>()
  let current: SearchProgress | null = null
  let startedMs = 0
  let notifiedMs = Number.NEGATIVE_INFINITY
  const set = (next: SearchProgress | null, nowMs: number) => {
    current = next
    notifiedMs = nowMs
    for (const listener of listeners) listener()
  }
  return {
    subscribe: (listener) => {
      listeners.add(listener)
      return () => listeners.delete(listener)
    },
    get: () => current,
    start: (nowMs) => {
      startedMs = nowMs
      set({ fraction: 0, round: 1, cap: 1, remainingMs: null }, nowMs)
    },
    report: (step, nowMs) => {
      if (step.kind !== "progress" || current === null) return
      if (nowMs - notifiedMs < throttleMs) return
      set(
        {
          fraction: step.fraction,
          round: step.round,
          cap: step.cap,
          remainingMs: estimateRemainingMs(step.fraction, nowMs - startedMs),
        },
        nowMs
      )
    },
    stop: () => {
      if (current !== null) set(null, Number.NEGATIVE_INFINITY)
    },
  }
}

/** The time left as one rounded unit: seconds under a minute (at least 1), whole minutes above. */
export function remainingTime(remainingMs: number): {
  value: number
  unit: "second" | "minute"
} {
  const seconds = Math.max(1, Math.ceil(remainingMs / 1000))
  return seconds < 60
    ? { value: seconds, unit: "second" }
    : { value: Math.ceil(seconds / 60), unit: "minute" }
}
