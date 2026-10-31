import { describe, expect, it, vi } from "vitest"

import {
  createSearchProgressTracker,
  estimateRemainingMs,
  remainingTime,
} from "./search-progress"

const step = (fraction: number, round = 1) => ({
  kind: "progress" as const,
  fraction,
  round,
  cap: 12,
})

describe("estimateRemainingMs", () => {
  it("scales the elapsed time by the share left", () => {
    expect(estimateRemainingMs(0.25, 1000)).toBe(3000)
  })
  it("is null too early to tell and once done", () => {
    expect(estimateRemainingMs(0.01, 1000)).toBeNull()
    expect(estimateRemainingMs(1, 1000)).toBeNull()
  })
})

describe("remainingTime", () => {
  it("rounds up to seconds under a minute and minutes above", () => {
    expect(remainingTime(200)).toEqual({ value: 1, unit: "second" })
    expect(remainingTime(42_100)).toEqual({ value: 43, unit: "second" })
    expect(remainingTime(61_000)).toEqual({ value: 2, unit: "minute" })
  })
})

describe("createSearchProgressTracker", () => {
  it("reports progress throttled, and clears when the search stops", () => {
    const tracker = createSearchProgressTracker(250)
    const listener = vi.fn()
    tracker.subscribe(listener)
    expect(tracker.get()).toBeNull()
    tracker.report(step(0.5), 0)
    expect(tracker.get()).toBeNull()

    tracker.start(0)
    expect(tracker.get()?.fraction).toBe(0)
    tracker.report(step(0.1), 100)
    expect(tracker.get()?.fraction).toBe(0)
    tracker.report(step(0.25, 4), 1000)
    expect(tracker.get()).toEqual({
      fraction: 0.25,
      round: 4,
      cap: 12,
      remainingMs: 3000,
    })
    tracker.report({ kind: "round", recommendations: [] }, 2000)
    expect(tracker.get()?.fraction).toBe(0.25)
    expect(listener).toHaveBeenCalledTimes(2)

    tracker.stop()
    expect(tracker.get()).toBeNull()
    expect(listener).toHaveBeenCalledTimes(3)
  })
})
