import { afterEach, describe, expect, it, vi } from "vitest"

import { selectHomeEvents, type HomeEventRow } from "./select-home-events"

const hse = (definitionId: string, startUtc: string, endUtc: string) => ({
  definitionId,
  startUtc,
  endUtc,
})
const le = (id: string, start: string) => ({
  id,
  eventStageStartDatesUtc: [start],
})

const machineHunt = hse(
  "hse-machine-hunt",
  "2026-10-01T08:00:00Z",
  "2026-10-05T08:00:00Z"
)
const trainingRush = hse(
  "hse-training-rush",
  "2026-10-09T08:00:00Z",
  "2026-10-12T08:00:00Z"
)
const warpSurge = hse(
  "hse-warp-surge",
  "2026-10-20T00:00:00Z",
  "2026-10-23T00:00:00Z"
)
const nightfall = hse(
  "hse-squig-smash",
  "2026-10-25T00:00:00Z",
  "2026-10-28T00:00:00Z"
)
const extra = hse(
  "hse-machine-hunt",
  "2026-11-01T00:00:00Z",
  "2026-11-04T00:00:00Z"
)
const early1 = hse("hse-a", "2026-10-04T00:00:00Z", "2026-10-05T00:00:00Z")
const early2 = hse("hse-b", "2026-10-06T00:00:00Z", "2026-10-07T00:00:00Z")
const early3 = hse("hse-c", "2026-10-08T00:00:00Z", "2026-10-09T00:00:00Z")
// Lysander's run 2026-09-29 → 2026-10-06 (7 days).
const lysander = le("astarLysander", "2026-09-29T00:00:00Z")
const uthar = le("votanUthar", "2026-10-11T00:00:00Z")
const lysanderProgress = {
  id: "astarLysander",
  currentEventRun: 2,
  currentPoints: 3410,
} as never

const summary = (rows: readonly HomeEventRow[]) =>
  rows.map((row) => [
    row.type === "homeScreen" ? row.definitionId : row.unitId,
    row.live,
  ])
// Live rows, then upcoming rows, as one list.
const both = (events: ReturnType<typeof selectHomeEvents>) => [
  ...events.live,
  ...events.upcoming,
]

describe("selectHomeEvents", () => {
  afterEach(() => vi.unstubAllEnvs())

  it("splits the live HSE and Legendary Event from the upcoming ones", () => {
    const events = selectHomeEvents({
      homeScreen: { active: machineHunt, upcoming: [trainingRush] },
      legendary: { events: [uthar, lysander], progress: [lysanderProgress] },
      nowMs: Date.parse("2026-10-03T12:00:00Z"),
    })

    expect(summary(events.live)).toEqual([
      ["hse-machine-hunt", true],
      ["astarLysander", true],
    ])
    expect(summary(events.upcoming)).toEqual([
      ["hse-training-rush", false],
      ["votanUthar", false],
    ])
    const rows = both(events)
    expect(rows[1]).toMatchObject({
      destination: "/legendary-events/astarLysander",
      runNumber: 2,
      points: 3410,
      endMs: Date.parse("2026-10-06T00:00:00Z"),
    })
    // The HSE row opens the HSE tab on that instance (a placeholder's key is definitionId@startUtc).
    expect(rows[0]).toMatchObject({
      destination: `/dailies/hse?event=${encodeURIComponent("hse-machine-hunt@2026-10-01T08:00:00Z")}`,
    })
  })

  it("keys an authored HSE occurrence by its occurrence id", () => {
    const events = selectHomeEvents({
      homeScreen: {
        active: { ...machineHunt, occurrenceId: "occ-machine-hunt" },
        upcoming: [],
      },
      legendary: { events: [], progress: [] },
      nowMs: Date.parse("2026-10-03T12:00:00Z"),
    })

    expect(events.live[0]).toMatchObject({
      destination: "/dailies/hse?event=occ-machine-hunt",
    })
  })

  it("orders only-upcoming events across both types by start", () => {
    const rows = both(
      selectHomeEvents({
        homeScreen: { active: null, upcoming: [trainingRush] },
        legendary: {
          events: [le("votanUthar", "2026-10-04T00:00:00Z")],
          progress: [],
        },
        nowMs: Date.parse("2026-10-02T00:00:00Z"),
      })
    )

    expect(summary(rows)).toEqual([
      ["votanUthar", false],
      ["hse-training-rush", false],
    ])
    expect(rows[0]).not.toHaveProperty("runNumber")
  })

  it("caps upcoming at three rows", () => {
    const events = selectHomeEvents({
      homeScreen: {
        active: machineHunt,
        upcoming: [trainingRush, warpSurge, nightfall, extra],
      },
      legendary: { events: [lysander, uthar], progress: [] },
      nowMs: Date.parse("2026-10-03T12:00:00Z"),
    })

    expect(summary(events.upcoming)).toEqual([
      ["hse-training-rush", false],
      ["votanUthar", false],
      ["hse-warp-surge", false],
    ])
  })

  it("pins the next Legendary Event into the last upcoming slot when none is live", () => {
    // Nothing live; three HSEs start before Uthar's run (2026-10-11).
    const events = selectHomeEvents({
      homeScreen: {
        active: null,
        upcoming: [early1, early2, early3],
      },
      legendary: { events: [uthar], progress: [] },
      nowMs: Date.parse("2026-10-03T12:00:00Z"),
    })

    expect(summary(events.upcoming)).toEqual([
      ["hse-a", false],
      ["hse-b", false],
      ["votanUthar", false],
    ])
  })

  it("does not pin an upcoming Legendary Event while one is live", () => {
    const events = selectHomeEvents({
      homeScreen: { active: null, upcoming: [early1, early2, early3] },
      legendary: { events: [lysander, uthar], progress: [] },
      nowMs: Date.parse("2026-10-03T12:00:00Z"),
    })

    expect(summary(events.live)).toEqual([["astarLysander", true]])
    expect(summary(events.upcoming)).toEqual([
      ["hse-a", false],
      ["hse-b", false],
      ["hse-c", false],
    ])
  })

  it("skips archived Legendary Events and tolerates a missing source", () => {
    const rows = both(
      selectHomeEvents({
        homeScreen: null,
        legendary: {
          events: [le("bloodDante", "2026-01-01T00:00:00Z"), uthar],
          progress: [],
        },
        nowMs: Date.parse("2026-10-03T12:00:00Z"),
      })
    )
    expect(summary(rows)).toEqual([["votanUthar", false]])

    expect(
      selectHomeEvents({
        homeScreen: { active: null, upcoming: [trainingRush] },
        legendary: null,
        nowMs: Date.parse("2026-10-03T12:00:00Z"),
      }).upcoming
    ).toHaveLength(1)
  })

  it("decides order and liveness by UTC instants, independent of the device timezone", () => {
    const input = {
      homeScreen: {
        active: null,
        upcoming: [
          hse("hse-x", "2026-10-02T08:00:00Z", "2026-10-05T08:00:00Z"),
        ],
      },
      legendary: {
        events: [le("votanUthar", "2026-10-02T07:00:00Z")],
        progress: [],
      },
      nowMs: Date.parse("2026-10-01T00:00:00Z"),
    }
    vi.stubEnv("TZ", "UTC")
    const utc = summary(both(selectHomeEvents(input)))
    vi.stubEnv("TZ", "Pacific/Honolulu")
    const honolulu = summary(both(selectHomeEvents(input)))

    expect(utc).toEqual([
      ["votanUthar", false],
      ["hse-x", false],
    ])
    expect(honolulu).toEqual(utc)
  })
})
