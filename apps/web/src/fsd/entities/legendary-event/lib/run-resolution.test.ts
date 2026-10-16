import { describe, expect, it } from "vitest"

import { deriveLegendaryEventLifecycle } from "./lifecycle"
import {
  legendaryEventHasProgress,
  resolveLegendaryEventRuns,
  type LegendaryEventRunResolutionInput,
} from "./run-resolution"

const at = (iso: string) => Date.parse(iso)
const NOW = at("2026-10-16T00:00:00Z")

/** Resolves with the lifecycle derived from the same schedule and clock, as the page does. */
function resolve(
  eventStageStartDatesUtc: string[],
  {
    nowMs = NOW,
    syncedRun = null,
    hasProgress = false,
  }: Partial<
    Pick<
      LegendaryEventRunResolutionInput,
      "nowMs" | "syncedRun" | "hasProgress"
    >
  > = {}
) {
  const schedule = { eventStageStartDatesUtc }
  return resolveLegendaryEventRuns({
    lifecycle: deriveLegendaryEventLifecycle(schedule, nowMs),
    schedule,
    syncedRun,
    hasProgress,
    nowMs,
  })
}

const UTHAR = ["2026-03-08T00:00:00Z", "2026-10-04T00:00:00Z"]

describe("resolveLegendaryEventRuns: schedule and clock", () => {
  it("Uthar between runs: 2 ended, next run 3 to be announced", () => {
    expect(resolve(UTHAR, { hasProgress: true })).toEqual({
      kind: "known",
      endedRuns: 2,
      currentRun: null,
      nextRun: 3,
      nextStartMs: null,
    })
  })

  it("Lysander after its first run: 1 ended, next run 2 to be announced", () => {
    const lysander = {
      currentPoints: 12_531,
      alpha: null,
      beta: null,
      gamma: null,
    }
    expect(
      resolve(["2026-08-30T00:00:00Z"], {
        hasProgress: legendaryEventHasProgress(lysander),
      })
    ).toEqual({
      kind: "known",
      endedRuns: 1,
      currentRun: null,
      nextRun: 2,
      nextStartMs: null,
    })
  })

  it("Fabius Bile before run 1: none ended, next run 1 starting 2026-11-08", () => {
    expect(resolve(["2026-11-08T00:00:00Z"])).toEqual({
      kind: "known",
      endedRuns: 0,
      currentRun: null,
      nextRun: 1,
      nextStartMs: at("2026-11-08T00:00:00Z"),
    })
  })

  it("between two announced runs: 1 ended, next run 2 starting 2026-10-18", () => {
    expect(
      resolve(["2026-10-04T00:00:00Z", "2026-10-18T00:00:00Z"], {
        nowMs: at("2026-10-14T00:00:00Z"),
        hasProgress: true,
      })
    ).toEqual({
      kind: "known",
      endedRuns: 1,
      currentRun: null,
      nextRun: 2,
      nextStartMs: at("2026-10-18T00:00:00Z"),
    })
  })

  it("every run ended: 3 ended and no next run", () => {
    expect(
      resolve(
        [
          "2026-03-08T00:00:00Z",
          "2026-06-07T00:00:00Z",
          "2026-09-06T00:00:00Z",
        ],
        { hasProgress: true }
      )
    ).toEqual({
      kind: "known",
      endedRuns: 3,
      currentRun: null,
      nextRun: null,
      nextStartMs: null,
    })
  })

  it("counts a run as ended exactly 7 days after its start", () => {
    const start = "2026-10-04T00:00:00Z"
    expect(
      resolve([start], { nowMs: at("2026-10-11T00:00:00Z") - 1, syncedRun: 1 })
    ).toMatchObject({ currentRun: 1, endedRuns: 0 })
    expect(
      resolve([start], { nowMs: at("2026-10-11T00:00:00Z") })
    ).toMatchObject({ currentRun: null, endedRuns: 1, nextRun: 2 })
  })
})

describe("resolveLegendaryEventRuns: the synced run while active", () => {
  const inRun2 = at("2026-10-06T00:00:00Z")

  it("the synced run beats the schedule", () => {
    expect(resolve(UTHAR, { nowMs: inRun2, syncedRun: 3 })).toEqual({
      kind: "known",
      endedRuns: 2,
      currentRun: 3,
      nextRun: null,
      nextStartMs: null,
    })
  })

  it("active without a synced run: the schedule window holding the clock", () => {
    expect(
      resolve(UTHAR, { nowMs: inRun2, syncedRun: null, hasProgress: true })
    ).toEqual({
      kind: "known",
      endedRuns: 1,
      currentRun: 2,
      nextRun: 3,
      nextStartMs: null,
    })
  })

  it("ignores a synced run between runs", () => {
    expect(resolve(UTHAR, { syncedRun: 1, hasProgress: true })).toMatchObject({
      endedRuns: 2,
      nextRun: 3,
    })
  })
})

describe("resolveLegendaryEventRuns: unknown run", () => {
  it("Farsight-like: progress (12,530 points) and an empty schedule", () => {
    expect(resolve([], { hasProgress: true })).toEqual({
      kind: "unknown",
      endedRuns: null,
      currentRun: null,
      nextRun: null,
      nextStartMs: null,
    })
  })

  it("progress (3,000 points) with only a future date", () => {
    expect(
      resolve(["2026-11-08T00:00:00Z"], { hasProgress: true })
    ).toMatchObject({ kind: "unknown" })
  })

  it("a fresh event (empty schedule, no synced entry) is not unknown", () => {
    expect(resolve([], { hasProgress: false })).toEqual({
      kind: "known",
      endedRuns: 0,
      currentRun: null,
      nextRun: 1,
      nextStartMs: null,
    })
  })

  it("a finished event is never unknown", () => {
    expect(
      resolve(
        [
          "2025-06-01T00:00:00Z",
          "2025-10-05T00:00:00Z",
          "2026-02-01T00:00:00Z",
        ],
        { hasProgress: true }
      )
    ).toMatchObject({
      kind: "known",
      endedRuns: 3,
      nextRun: null,
    })
  })
})

describe("legendaryEventHasProgress", () => {
  const empty = { currentPoints: 0, alpha: null, beta: null, gamma: null }

  it("reads points above 0 or a played encounter", () => {
    expect(legendaryEventHasProgress(undefined)).toBe(false)
    expect(legendaryEventHasProgress(empty)).toBe(false)
    expect(legendaryEventHasProgress({ ...empty, currentPoints: 3000 })).toBe(
      true
    )
    expect(
      legendaryEventHasProgress({
        ...empty,
        beta: {
          encounters: [
            { objectivesCleared: [0], highScore: 0, encounterPoints: 0 },
          ],
        },
      })
    ).toBe(true)
    expect(
      legendaryEventHasProgress({
        ...empty,
        gamma: {
          encounters: [
            { objectivesCleared: [], highScore: 0, encounterPoints: 0 },
          ],
        },
      })
    ).toBe(false)
  })
})
