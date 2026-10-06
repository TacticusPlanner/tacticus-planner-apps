import { afterEach, describe, expect, it, vi } from "vitest"

import { selectHomeEventRows } from "./select-home-event-rows"

const hse = (definitionId: string, startUtc: string, endUtc: string) => ({
  definitionId,
  startUtc,
  endUtc,
})
const le = (id: string, start: string, finished = false) => ({
  id,
  finished,
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
// Lysander's run 2026-09-29 → 2026-10-06 (7 days).
const lysander = le("astarLysander", "2026-09-29T00:00:00Z")
const uthar = le("votanUthar", "2026-10-11T00:00:00Z")
const lysanderProgress = {
  id: "astarLysander",
  currentEventRun: 2,
  currentPoints: 3410,
} as never

const summary = (rows: ReturnType<typeof selectHomeEventRows>) =>
  rows.map((row) => [
    row.type === "homeScreen" ? row.definitionId : row.unitId,
    row.live,
  ])

describe("selectHomeEventRows", () => {
  afterEach(() => vi.unstubAllEnvs())

  it("lists the live HSE, the live Legendary Event, then the earliest upcoming one", () => {
    const rows = selectHomeEventRows({
      homeScreen: { active: machineHunt, upcoming: [trainingRush] },
      legendary: { events: [uthar, lysander], progress: [lysanderProgress] },
      nowMs: Date.parse("2026-10-03T12:00:00Z"),
    })

    expect(summary(rows)).toEqual([
      ["hse-machine-hunt", true],
      ["astarLysander", true],
      ["hse-training-rush", false],
    ])
    expect(rows[1]).toMatchObject({
      destination: "/events/legendary-events/astarLysander",
      runNumber: 2,
      points: 3410,
      endMs: Date.parse("2026-10-06T00:00:00Z"),
    })
    expect(rows[0]).toMatchObject({ destination: "/dailies/hse" })
  })

  it("orders only-upcoming events across both types by start", () => {
    const rows = selectHomeEventRows({
      homeScreen: { active: null, upcoming: [trainingRush] },
      legendary: {
        events: [le("votanUthar", "2026-10-04T00:00:00Z")],
        progress: [],
      },
      nowMs: Date.parse("2026-10-02T00:00:00Z"),
    })

    expect(summary(rows)).toEqual([
      ["votanUthar", false],
      ["hse-training-rush", false],
    ])
    expect(rows[0]).not.toHaveProperty("runNumber")
  })

  it("caps at three rows", () => {
    const rows = selectHomeEventRows({
      homeScreen: { active: machineHunt, upcoming: [trainingRush, warpSurge] },
      legendary: { events: [lysander, uthar], progress: [] },
      nowMs: Date.parse("2026-10-03T12:00:00Z"),
    })

    expect(summary(rows)).toEqual([
      ["hse-machine-hunt", true],
      ["astarLysander", true],
      ["hse-training-rush", false],
    ])
  })

  it("skips archived Legendary Events and tolerates a missing source", () => {
    const rows = selectHomeEventRows({
      homeScreen: null,
      legendary: {
        events: [le("bloodDante", "2026-01-01T00:00:00Z"), uthar],
        progress: [],
      },
      nowMs: Date.parse("2026-10-03T12:00:00Z"),
    })
    expect(summary(rows)).toEqual([["votanUthar", false]])

    expect(
      selectHomeEventRows({
        homeScreen: { active: null, upcoming: [trainingRush] },
        legendary: null,
        nowMs: Date.parse("2026-10-03T12:00:00Z"),
      })
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
    const utc = summary(selectHomeEventRows(input))
    vi.stubEnv("TZ", "Pacific/Honolulu")
    const honolulu = summary(selectHomeEventRows(input))

    expect(utc).toEqual([
      ["votanUthar", false],
      ["hse-x", false],
    ])
    expect(honolulu).toEqual(utc)
  })
})
